package expo.modules.videoeditor

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class VideoSourceRecord : Record {
  @Field val uri: String = ""
}

class SeekRecord : Record {
  @Field val seq: Int = 0
  @Field val positionMs: Int = 0
}

class ExportPayload : Record {
  @Field val sourceUri: String = ""
  @Field val startMs: Int = 0
  @Field val endMs: Int = 0
  // 0 = keep source height; otherwise cap (720/1080). Applied when we re-encode.
  @Field val resolution: Int = 0
  @Field val bitrate: Int = 0
  // 4×5 color matrix (20 numbers); empty = no filter → passthrough
  @Field val colorMatrix: List<Double> = emptyList()
}
