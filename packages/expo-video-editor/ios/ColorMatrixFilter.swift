import AVFoundation
import CoreImage

enum ColorMatrixFilter {
  static func makeFilter(_ m: [Double]) -> CIFilter? {
    guard m.count >= 20, let filter = CIFilter(name: "CIColorMatrix") else { return nil }
    filter.setValue(CIVector(x: CGFloat(m[0]), y: CGFloat(m[1]), z: CGFloat(m[2]), w: CGFloat(m[3])), forKey: "inputRVector")
    filter.setValue(CIVector(x: CGFloat(m[5]), y: CGFloat(m[6]), z: CGFloat(m[7]), w: CGFloat(m[8])), forKey: "inputGVector")
    filter.setValue(CIVector(x: CGFloat(m[10]), y: CGFloat(m[11]), z: CGFloat(m[12]), w: CGFloat(m[13])), forKey: "inputBVector")
    filter.setValue(CIVector(x: CGFloat(m[15]), y: CGFloat(m[16]), z: CGFloat(m[17]), w: CGFloat(m[18])), forKey: "inputAVector")
    filter.setValue(CIVector(x: CGFloat(m[4]), y: CGFloat(m[9]), z: CGFloat(m[14]), w: CGFloat(m[19])), forKey: "inputBiasVector")
    return filter
  }

  static func videoComposition(for asset: AVAsset, matrix: [Double]) -> AVVideoComposition? {
    guard let filter = makeFilter(matrix) else { return nil }
    return AVMutableVideoComposition(asset: asset) { request in
      let source = request.sourceImage.clampedToExtent()
      filter.setValue(source, forKey: kCIInputImageKey)
      let output = filter.outputImage?.cropped(to: request.sourceImage.extent) ?? request.sourceImage
      request.finish(with: output, context: nil)
    }
  }
}
