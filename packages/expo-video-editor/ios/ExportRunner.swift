import AVFoundation
import Foundation

/**
 * Single-pass native export via AVFoundation.
 * Phase 1: trim only → passthrough preset (no re-encode), near-instant.
 * Phase 2 swaps to a re-encoding preset + AVMutableVideoComposition for filters.
 */
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
    let asset = AVURLAsset(url: url)
    guard let session = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough) else {
      reject("EXPORT_FAILED", "Could not create export session")
      return
    }

    let outURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("vieditor-export-\(UUID().uuidString).mp4")
    session.outputURL = outURL
    session.outputFileType = .mp4
    session.shouldOptimizeForNetworkUse = true

    if payload.endMs > payload.startMs {
      let start = CMTime(value: CMTimeValue(payload.startMs), timescale: 1000)
      let duration = CMTime(value: CMTimeValue(payload.endMs - payload.startMs), timescale: 1000)
      session.timeRange = CMTimeRange(start: start, duration: duration)
    }
    self.session = session

    DispatchQueue.main.async {
      self.progressTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { _ in
        onProgress(Double(session.progress))
      }
    }

    session.exportAsynchronously { [weak self] in
      DispatchQueue.main.async {
        self?.progressTimer?.invalidate()
        self?.progressTimer = nil
      }
      switch session.status {
      case .completed:
        onProgress(1.0)
        Task {
          let result = await Self.readResult(outURL)
          resolve(result)
        }
      case .cancelled:
        reject("CANCELLED", "Export cancelled")
      default:
        reject("EXPORT_FAILED", session.error?.localizedDescription ?? "Export failed")
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
