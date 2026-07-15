import ExpoModulesCore

struct VideoSourceRecord: Record {
  @Field var uri: String = ""
}

struct SeekRecord: Record {
  @Field var seq: Int = 0
  @Field var positionMs: Int = 0
}

struct ExportPayload: Record {
  @Field var sourceUri: String = ""
  @Field var startMs: Int = 0
  @Field var endMs: Int = 0
  // 0 = keep source height; otherwise cap (720/1080). Applied once we re-encode (Phase 2).
  @Field var resolution: Int = 0
  @Field var bitrate: Int = 0
}
