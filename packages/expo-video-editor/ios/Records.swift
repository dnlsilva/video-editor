import ExpoModulesCore

struct VideoSourceRecord: Record {
  @Field var uri: String = ""
}

struct SeekRecord: Record {
  @Field var seq: Int = 0
  @Field var positionMs: Int = 0
}

struct OverlayRecord: Record {
  @Field var uri: String = ""
  @Field var animated: Bool = false
  @Field var centerX: Double = 0.5
  @Field var centerY: Double = 0.5
  @Field var widthFraction: Double = 0.0
  @Field var heightFraction: Double = 0.0
  @Field var rotationDeg: Double = 0.0
}

struct AudioRecord: Record {
  @Field var uri: String = ""
  @Field var trimStartMs: Int = 0
  @Field var trimEndMs: Int = 0
  @Field var volume: Double = 1
  @Field var loop: Bool = true
}

struct ExportPayload: Record {
  @Field var sourceUri: String = ""
  @Field var startMs: Int = 0
  @Field var endMs: Int = 0
  @Field var resolution: Int = 0
  @Field var bitrate: Int = 0
  @Field var colorMatrix: [Double] = []
  @Field var overlays: [OverlayRecord] = []
  @Field var audio: AudioRecord?
  @Field var originalVolume: Double = 1
}
