import AVFoundation
import CoreImage
import ImageIO

enum FrameComposer {
  private struct LoadedOverlay {
    let frames: [CIImage]
    let cumulative: [Double]
    let total: Double
    let rec: OverlayRecord

    func image(at time: Double) -> CIImage {
      if frames.count <= 1 || total <= 0 { return frames[0] }
      let t = time.truncatingRemainder(dividingBy: total)
      for (i, end) in cumulative.enumerated() where t < end { return frames[i] }
      return frames[frames.count - 1]
    }
  }

  static func videoComposition(
    for asset: AVAsset,
    matrix: [Double],
    overlays: [OverlayRecord]
  ) -> AVVideoComposition? {
    let filter = ColorMatrixFilter.makeFilter(matrix)
    let loaded = overlays.compactMap { load($0) }
    if filter == nil && loaded.isEmpty { return nil }

    return AVMutableVideoComposition(asset: asset) { request in
      let extent = request.sourceImage.extent
      var image = request.sourceImage.clampedToExtent()
      if let filter = filter {
        filter.setValue(image, forKey: kCIInputImageKey)
        image = filter.outputImage?.cropped(to: extent) ?? image
      }
      let time = request.compositionTime.seconds
      for overlay in loaded {
        image = composite(overlay: overlay.image(at: time), over: image, frame: extent, rec: overlay.rec)
      }
      request.finish(with: image, context: nil)
    }
  }

  private static func composite(overlay: CIImage, over base: CIImage, frame: CGRect, rec: OverlayRecord) -> CIImage {
    let oe = overlay.extent
    guard oe.width > 0, oe.height > 0, frame.width > 0, frame.height > 0 else { return base }
    let sx = (rec.widthFraction * frame.width) / oe.width
    let sy = (rec.heightFraction * frame.height) / oe.height
    let cx = frame.minX + rec.centerX * frame.width
    let cy = frame.minY + (1 - rec.centerY) * frame.height

    let transform = CGAffineTransform(translationX: cx, y: cy)
      .rotated(by: -rec.rotationDeg * .pi / 180)
      .scaledBy(x: sx, y: sy)
      .translatedBy(x: -oe.midX, y: -oe.midY)

    return overlay.transformed(by: transform).composited(over: base)
  }

  private static func load(_ rec: OverlayRecord) -> LoadedOverlay? {
    guard let url = fileURL(rec.uri) else { return nil }
    if rec.animated, let source = CGImageSourceCreateWithURL(url as CFURL, nil) {
      let count = CGImageSourceGetCount(source)
      if count > 1 {
        var frames: [CIImage] = []
        var cumulative: [Double] = []
        var acc = 0.0
        for i in 0..<count {
          guard let cg = CGImageSourceCreateImageAtIndex(source, i, nil) else { continue }
          frames.append(CIImage(cgImage: cg))
          acc += gifDelay(source, i)
          cumulative.append(acc)
        }
        if !frames.isEmpty {
          return LoadedOverlay(frames: frames, cumulative: cumulative, total: acc, rec: rec)
        }
      }
    }
    guard let image = CIImage(contentsOf: url) else { return nil }
    return LoadedOverlay(frames: [image], cumulative: [0], total: 0, rec: rec)
  }

  private static func gifDelay(_ source: CGImageSource, _ index: Int) -> Double {
    guard let props = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any],
          let gif = props[kCGImagePropertyGIFDictionary] as? [CFString: Any] else { return 0.1 }
    let unclamped = gif[kCGImagePropertyGIFUnclampedDelayTime] as? Double
    let delay = unclamped ?? (gif[kCGImagePropertyGIFDelayTime] as? Double) ?? 0.1
    return delay > 0 ? delay : 0.1
  }

  private static func fileURL(_ uri: String) -> URL? {
    uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : (URL(string: uri) ?? URL(fileURLWithPath: uri))
  }
}
