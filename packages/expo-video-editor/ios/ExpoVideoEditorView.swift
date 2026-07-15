import AVFoundation
import ExpoModulesCore
import UIKit

/** Prop-driven AVPlayer preview. Loops within [loopStart, loopEnd] and reports progress/metadata. */
class ExpoVideoEditorView: ExpoView {
  private let onLoad = EventDispatcher()
  private let onProgress = EventDispatcher()
  private let onEnded = EventDispatcher()

  private let player = AVPlayer()
  private let playerLayer = AVPlayerLayer()
  private var timeObserver: Any?
  private var statusObservation: NSKeyValueObservation?

  private var loopStartMs: Int = 0
  private var loopEndMs: Int = 0
  private var lastSeekSeq: Int = -1
  private var didEmitLoad = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    playerLayer.player = player
    playerLayer.videoGravity = .resizeAspect
    layer.addSublayer(playerLayer)

    let interval = CMTime(value: 1, timescale: 20) // ~50ms
    timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
      self?.onTick(time)
    }
  }

  deinit {
    if let observer = timeObserver {
      player.removeTimeObserver(observer)
    }
    statusObservation?.invalidate()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    playerLayer.frame = bounds
  }

  func setSource(_ uri: String) {
    guard let url = Self.urlFrom(uri) else { return }
    didEmitLoad = false
    let item = AVPlayerItem(url: url)
    statusObservation?.invalidate()
    statusObservation = item.observe(\.status, options: [.new]) { [weak self] observed, _ in
      guard let self = self, observed.status == .readyToPlay, !self.didEmitLoad else { return }
      self.didEmitLoad = true
      self.emitLoad(item)
    }
    player.replaceCurrentItem(with: item)
    player.play()
  }

  func setPaused(_ paused: Bool) {
    paused ? player.pause() : player.play()
  }

  func setLoopStart(_ ms: Int) {
    loopStartMs = ms
  }

  func setLoopEnd(_ ms: Int) {
    loopEndMs = ms
  }

  func seekTo(seq: Int, positionMs: Int) {
    guard seq != lastSeekSeq else { return }
    lastSeekSeq = seq
    let target = CMTime(value: CMTimeValue(max(0, positionMs)), timescale: 1000)
    player.seek(to: target, toleranceBefore: .zero, toleranceAfter: .zero)
  }

  private func onTick(_ time: CMTime) {
    let seconds = CMTimeGetSeconds(time)
    guard seconds.isFinite else { return }
    let posMs = Int(seconds * 1000)

    let itemSeconds = player.currentItem.map { CMTimeGetSeconds($0.duration) } ?? 0
    let itemDurMs = itemSeconds.isFinite ? Int(itemSeconds * 1000) : 0
    let end = loopEndMs > 0 ? loopEndMs : itemDurMs
    if end > 0 && posMs >= end {
      let start = CMTime(value: CMTimeValue(max(0, loopStartMs)), timescale: 1000)
      player.seek(to: start, toleranceBefore: .zero, toleranceAfter: .zero)
    }
    onProgress(["positionMs": posMs])
  }

  private func emitLoad(_ item: AVPlayerItem) {
    Task {
      let asset = item.asset
      let durationSeconds = (try? await asset.load(.duration).seconds) ?? 0
      let durationMs = durationSeconds.isFinite ? Int(durationSeconds * 1000) : 0

      var width = 0
      var height = 0
      var rotationDeg = 0
      if let track = try? await asset.loadTracks(withMediaType: .video).first {
        let naturalSize = (try? await track.load(.naturalSize)) ?? .zero
        let transform = (try? await track.load(.preferredTransform)) ?? .identity
        let resolved = naturalSize.applying(transform)
        width = Int(abs(resolved.width))
        height = Int(abs(resolved.height))
        rotationDeg = Int((atan2(transform.b, transform.a) * 180 / .pi).rounded())
      }

      await MainActor.run {
        self.onLoad([
          "durationMs": durationMs,
          "width": width,
          "height": height,
          "rotationDeg": rotationDeg,
        ])
      }
    }
  }

  static func urlFrom(_ uri: String) -> URL? {
    if uri.hasPrefix("/") { return URL(fileURLWithPath: uri) }
    return URL(string: uri)
  }
}
