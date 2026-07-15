package expo.modules.videoeditor

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.Effect
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import expo.modules.kotlin.Promise
import java.io.File

/**
 * Single-pass native export via Media3 Transformer.
 * Phase 1: trim only → no effects → Transformer transmuxes (passthrough), near-instant.
 * Later phases add a color-matrix effect, overlays, and an audio-mix sequence.
 */
@UnstableApi
class ExportRunner(
  private val context: Context,
  private val onProgress: (Double) -> Unit
) {
  private var transformer: Transformer? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private val progressHolder = ProgressHolder()
  private var polling = false

  private val poller = object : Runnable {
    override fun run() {
      val t = transformer ?: return
      val state = t.getProgress(progressHolder)
      if (state != Transformer.PROGRESS_STATE_NOT_STARTED) {
        onProgress(progressHolder.progress / 100.0)
      }
      if (polling) mainHandler.postDelayed(this, 200)
    }
  }

  fun export(payload: ExportPayload, promise: Promise) {
    // Transformer must be created/started on a Looper thread.
    mainHandler.post {
      try {
        val outFile = File(context.cacheDir, "vieditor-export-${System.nanoTime()}.mp4")

        val clipping = if (payload.endMs > payload.startMs) {
          MediaItem.ClippingConfiguration.Builder()
            .setStartPositionMs(payload.startMs.toLong())
            .setEndPositionMs(payload.endMs.toLong())
            .build()
        } else {
          MediaItem.ClippingConfiguration.UNSET
        }

        val mediaItem = MediaItem.Builder()
          .setUri(Uri.parse(payload.sourceUri))
          .setClippingConfiguration(clipping)
          .build()

        // Non-empty color matrix → GPU effect (forces re-encode); empty → passthrough transmux.
        val videoEffects: List<Effect> = if (payload.colorMatrix.size >= 20) {
          listOf(ColorMatrixEffect(FloatArray(20) { payload.colorMatrix[it].toFloat() }))
        } else {
          emptyList()
        }
        val edited = EditedMediaItem.Builder(mediaItem)
          .setEffects(Effects(emptyList(), videoEffects))
          .build()

        val t = Transformer.Builder(context)
          .addListener(object : Transformer.Listener {
            override fun onCompleted(composition: Composition, exportResult: ExportResult) {
              stopPolling()
              onProgress(1.0)
              promise.resolve(readResult(outFile, payload))
            }

            override fun onError(
              composition: Composition,
              exportResult: ExportResult,
              exception: ExportException
            ) {
              stopPolling()
              promise.reject("EXPORT_FAILED", exception.message ?: "Export failed", exception)
            }
          })
          .build()

        transformer = t
        t.start(edited, outFile.absolutePath)
        startPolling()
      } catch (e: Exception) {
        promise.reject("EXPORT_FAILED", e.message ?: "Export setup failed", e)
      }
    }
  }

  fun cancel() {
    mainHandler.post {
      transformer?.cancel()
      stopPolling()
    }
  }

  private fun startPolling() {
    polling = true
    mainHandler.post(poller)
  }

  private fun stopPolling() {
    polling = false
    mainHandler.removeCallbacks(poller)
  }

  private fun readResult(file: File, payload: ExportPayload): Map<String, Any> {
    var width = 0
    var height = 0
    var durationMs = (payload.endMs - payload.startMs).toLong().coerceAtLeast(0)
    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(file.absolutePath)
      width = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
      height = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
      retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()?.let {
        if (it > 0) durationMs = it
      }
    } catch (_: Exception) {
      // fall back to payload-derived duration and zero dims
    } finally {
      retriever.release()
    }
    return mapOf(
      "uri" to Uri.fromFile(file).toString(),
      "width" to width,
      "height" to height,
      "durationMs" to durationMs.toDouble()
    )
  }
}
