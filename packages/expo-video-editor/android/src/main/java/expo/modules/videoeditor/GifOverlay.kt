package expo.modules.videoeditor

import android.graphics.Bitmap
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlaySettings

/**
 * Animated overlay: returns the GIF frame matching the video timestamp (looping over the
 * clip). Frames are pre-decoded; settings (scale/anchor/rotation) are fixed for all frames.
 */
@UnstableApi
class GifOverlay(
  private val frames: List<Bitmap>,
  private val frameDurationsUs: LongArray,
  private val settings: OverlaySettings,
) : BitmapOverlay() {
  private val totalUs = frameDurationsUs.sum().coerceAtLeast(1)

  override fun getBitmap(presentationTimeUs: Long): Bitmap {
    val t = presentationTimeUs % totalUs
    var acc = 0L
    for (i in frames.indices) {
      acc += frameDurationsUs[i]
      if (t < acc) return frames[i]
    }
    return frames.last()
  }

  override fun getOverlaySettings(presentationTimeUs: Long): OverlaySettings = settings
}
