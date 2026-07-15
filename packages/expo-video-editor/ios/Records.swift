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
  @Field var centerX: Double = 0.5
  @Field var centerY: Double = 0.5
  @Field var widthFraction: Double = 0.0
  @Field var heightFraction: Double = 0.0
  @Field var rotationDeg: Double = 0.0
}

struct ExportPayload: Record {
  @Field var sourceUri: String = ""
  @Field var startMs: Int = 0
  @Field var endMs: Int = 0
  // 0 = keep source height; otherwise cap (720/1080). Applied when we re-encode.
  @Field var resolution: Int = 0
  @Field var bitrate: Int = 0
  // 4×5 color matrix (20 numbers); empty = no filter → passthrough
  @Field var colorMatrix: [Double] = []
  // rasterized overlays burned in at export
  @Field var overlays: [OverlayRecord] = []
}
