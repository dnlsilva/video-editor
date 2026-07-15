import AVFoundation
import Foundation

class ExportRunner {
  private var session: AVAssetExportSession?
  private var progressTimer: Timer?

  func export(
    _ payload: ExportPayload,
    onProgress: @escaping (Double) -> Void,
    resolve: @escaping (Any?) -> Void,
    reject: @escaping (String, String) -> Void
  ) {
    guard let url = Self.urlFrom(payload.sourceUri) else {
      reject("SOURCE_LOAD", "Invalid source URI")
      return
    }
    let source = AVURLAsset(url: url)

    Task {
      do {
        let hasComposition = payload.colorMatrix.count >= 20 || !payload.overlays.isEmpty
        let hasAudio = payload.audio != nil

        let exportAsset: AVAsset
        var audioMix: AVAudioMix?
        var trimBaked = false
        if hasAudio {
          let (composition, mix) = try await AudioMixBuilder.build(source: source, payload: payload)
          exportAsset = composition
          audioMix = mix
          trimBaked = true
        } else {
          exportAsset = source
        }

        let needsReencode = hasComposition || hasAudio
        let preset = needsReencode ? AVAssetExportPresetHighestQuality : AVAssetExportPresetPassthrough
        guard let session = AVAssetExportSession(asset: exportAsset, presetName: preset) else {
          reject("EXPORT_FAILED", "Could not create export session")
          return
        }

        let outURL = FileManager.default.temporaryDirectory
          .appendingPathComponent("vieditor-export-\(UUID().uuidString).mp4")
        session.outputURL = outURL
        session.outputFileType = .mp4
        session.shouldOptimizeForNetworkUse = true

        if !trimBaked, payload.endMs > payload.startMs {
          let start = CMTime(value: CMTimeValue(payload.startMs), timescale: 1000)
          let duration = CMTime(value: CMTimeValue(payload.endMs - payload.startMs), timescale: 1000)
          session.timeRange = CMTimeRange(start: start, duration: duration)
        }
        if hasComposition {
          session.videoComposition = FrameComposer.videoComposition(
            for: exportAsset,
            matrix: payload.colorMatrix,
            overlays: payload.overlays
          )
        }
        if let audioMix = audioMix {
          session.audioMix = audioMix
        }
        self.session = session

        await MainActor.run {
          self.progressTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { _ in
            onProgress(Double(session.progress))
          }
        }

        session.exportAsynchronously { [weak self] in
          Task { @MainActor in
            self?.progressTimer?.invalidate()
            self?.progressTimer = nil
          }
          switch session.status {
          case .completed:
            onProgress(1.0)
            Task { resolve(await Self.readResult(outURL)) }
          case .cancelled:
            reject("CANCELLED", "Export cancelled")
          default:
            reject("EXPORT_FAILED", session.error?.localizedDescription ?? "Export failed")
          }
        }
      } catch {
        reject("EXPORT_FAILED", error.localizedDescription)
      }
    }
  }

  func cancel() {
    session?.cancelExport()
  }

  private static func readResult(_ url: URL) async -> [String: Any] {
    let asset = AVURLAsset(url: url)
    let durationSeconds = (try? await asset.load(.duration).seconds) ?? 0
    let durationMs = durationSeconds.isFinite ? Int(durationSeconds * 1000) : 0

    var width = 0
    var height = 0
    if let track = try? await asset.loadTracks(withMediaType: .video).first {
      let naturalSize = (try? await track.load(.naturalSize)) ?? .zero
      let transform = (try? await track.load(.preferredTransform)) ?? .identity
      let resolved = naturalSize.applying(transform)
      width = Int(abs(resolved.width))
      height = Int(abs(resolved.height))
    }

    return [
      "uri": url.absoluteString,
      "width": width,
      "height": height,
      "durationMs": durationMs,
    ]
  }

  static func urlFrom(_ uri: String) -> URL? {
    if uri.hasPrefix("/") { return URL(fileURLWithPath: uri) }
    return URL(string: uri)
  }
}
