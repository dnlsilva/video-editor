import AVFoundation
import CoreImage

/**
 * One video composition that applies the color matrix and then composites overlays, so a
 * single re-encode covers filter + text + GIF. Overlays are placed by fraction of the frame
 * (CI's origin is bottom-left, so centerY is flipped) and rotated clockwise to match the UI.
 */
enum FrameComposer {
  static func videoComposition(
    for asset: AVAsset,
    matrix: [Double],
    overlays: [OverlayRecord]
  ) -> AVVideoComposition? {
    let filter = ColorMatrixFilter.makeFilter(matrix)
    let loaded: [(CIImage, OverlayRecord)] = overlays.compactMap { rec in
      guard let image = loadImage(rec.uri) else { return nil }
      return (image, rec)
    }
    if filter == nil && loaded.isEmpty { return nil }

    return AVMutableVideoComposition(asset: asset) { request in
      let extent = request.sourceImage.extent
      var image = request.sourceImage.clampedToExtent()
      if let filter = filter {
        filter.setValue(image, forKey: kCIInputImageKey)
        image = filter.outputImage?.cropped(to: extent) ?? image
      }
      for (overlay, rec) in loaded {
        image = composite(overlay: overlay, over: image, frame: extent, rec: rec)
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
    let cy = frame.minY + (1 - rec.centerY) * frame.height // CI origin is bottom-left

    let transform = CGAffineTransform(translationX: cx, y: cy)
      .rotated(by: -rec.rotationDeg * .pi / 180) // screen is clockwise-positive; CI is ccw
      .scaledBy(x: sx, y: sy)
      .translatedBy(x: -oe.midX, y: -oe.midY) // pivot on the overlay's own center

    return overlay.transformed(by: transform).composited(over: base)
  }

  private static func loadImage(_ uri: String) -> CIImage? {
    let url: URL = uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : (URL(string: uri) ?? URL(fileURLWithPath: uri))
    return CIImage(contentsOf: url)
  }
}
