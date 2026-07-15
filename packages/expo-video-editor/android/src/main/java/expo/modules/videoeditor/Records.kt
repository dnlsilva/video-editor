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

class OverlayRecord : Record {
  @Field val uri: String = ""
  @Field val animated: Boolean = false
  @Field val centerX: Double = 0.5
  @Field val centerY: Double = 0.5
  @Field val widthFraction: Double = 0.0
  @Field val heightFraction: Double = 0.0
  @Field val rotationDeg: Double = 0.0
}

class AudioRecord : Record {
  @Field val uri: String = ""
  @Field val trimStartMs: Int = 0
  @Field val trimEndMs: Int = 0
  @Field val volume: Double = 1.0
  @Field val loop: Boolean = true
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
  // rasterized overlays burned in at export
  @Field val overlays: List<OverlayRecord> = emptyList()
  // background music to mix, or null
  @Field val audio: AudioRecord? = null
  // volume of the source's own audio, 0..1
  @Field val originalVolume: Double = 1.0
}
