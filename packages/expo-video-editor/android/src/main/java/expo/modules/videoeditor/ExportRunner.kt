package expo.modules.videoeditor

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Movie
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.Effect
import androidx.media3.common.MediaItem
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.audio.ChannelMixingAudioProcessor
import androidx.media3.common.audio.ChannelMixingMatrix
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.StaticOverlaySettings
import androidx.media3.effect.TextureOverlay
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.EditedMediaItemSequence
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import com.google.common.collect.ImmutableList
import expo.modules.kotlin.Promise
import java.io.File
import java.io.FileInputStream
import java.io.InputStream

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

        val videoEffects = mutableListOf<Effect>()
        if (payload.colorMatrix.size >= 20) {
          videoEffects.add(ColorMatrixEffect(FloatArray(20) { payload.colorMatrix[it].toFloat() }))
        }
        if (payload.overlays.isNotEmpty()) {
          val (outW, outH) = readSourceSize(payload.sourceUri)
          val overlays = payload.overlays.mapNotNull { buildOverlay(it, outW, outH) }
          if (overlays.isNotEmpty()) {
            videoEffects.add(OverlayEffect(ImmutableList.copyOf(overlays)))
          }
        }
        val audio = payload.audio
        val originalAudioProcessors: List<AudioProcessor> =
          if (audio != null && payload.originalVolume != 1.0) {
            listOf(volumeProcessor(payload.originalVolume.toFloat()))
          } else {
            emptyList()
          }
        val videoEdited = EditedMediaItem.Builder(mediaItem)
          .setEffects(Effects(originalAudioProcessors, videoEffects))
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
        if (audio != null) {
          val clipping = if (audio.trimEndMs > audio.trimStartMs) {
            MediaItem.ClippingConfiguration.Builder()
              .setStartPositionMs(audio.trimStartMs.toLong())
              .setEndPositionMs(audio.trimEndMs.toLong())
              .build()
          } else {
            MediaItem.ClippingConfiguration.UNSET
          }
          val musicItem = MediaItem.Builder()
            .setUri(Uri.parse(audio.uri))
            .setClippingConfiguration(clipping)
            .build()
          val musicEdited = EditedMediaItem.Builder(musicItem)
            .setRemoveVideo(true)
            .setEffects(Effects(listOf(volumeProcessor(audio.volume.toFloat())), emptyList()))
            .build()
          val videoSequence = EditedMediaItemSequence.Builder(videoEdited).build()
          val musicSequence = EditedMediaItemSequence.Builder(musicEdited).setIsLooping(audio.loop).build()
          val composition = Composition.Builder(videoSequence, musicSequence).build()
          t.start(composition, outFile.absolutePath)
        } else {
          t.start(videoEdited, outFile.absolutePath)
        }
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

  private fun volumeProcessor(volume: Float): AudioProcessor {
    val processor = ChannelMixingAudioProcessor()
    processor.putChannelMixingMatrix(ChannelMixingMatrix.create(1, 1).scaleBy(volume))
    processor.putChannelMixingMatrix(ChannelMixingMatrix.create(2, 2).scaleBy(volume))
    return processor
  }

  private fun readSourceSize(uri: String): Pair<Int, Int> {
    val retriever = MediaMetadataRetriever()
    return try {
      retriever.setDataSource(context, Uri.parse(uri))
      val w = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
      val h = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
      val rot = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
      if (rot == 90 || rot == 270) Pair(h, w) else Pair(w, h)
    } catch (_: Exception) {
      Pair(0, 0)
    } finally {
      retriever.release()
    }
  }

  private fun openStream(uriStr: String): InputStream? {
    return try {
      val uri = Uri.parse(uriStr)
      if (uri.scheme == null || uri.scheme == "file") FileInputStream(uri.path ?: uriStr)
      else context.contentResolver.openInputStream(uri)
    } catch (_: Exception) {
      null
    }
  }

  private fun loadBitmap(uriStr: String): Bitmap? =
    openStream(uriStr)?.use { runCatching { BitmapFactory.decodeStream(it) }.getOrNull() }

  private fun decodeGifFrames(uriStr: String): Pair<List<Bitmap>, LongArray>? {
    val movie = openStream(uriStr)?.use { Movie.decodeStream(it) } ?: return null
    val w = movie.width()
    val h = movie.height()
    if (w <= 0 || h <= 0) return null
    val duration = movie.duration().coerceAtLeast(1)
    val stepMs = 50
    val frames = mutableListOf<Bitmap>()
    var t = 0
    while (t < duration) {
      val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      movie.setTime(t)
      movie.draw(Canvas(bmp), 0f, 0f)
      frames.add(bmp)
      t += stepMs
    }
    if (frames.isEmpty()) return null
    return Pair(frames, LongArray(frames.size) { stepMs * 1000L })
  }

  private fun overlaySettings(rec: OverlayRecord, bmpW: Int, bmpH: Int, outW: Int, outH: Int): StaticOverlaySettings {
    val sx = (rec.widthFraction * outW / bmpW).toFloat()
    val sy = (rec.heightFraction * outH / bmpH).toFloat()
    val bgX = (rec.centerX * 2 - 1).toFloat()
    val bgY = (1 - rec.centerY * 2).toFloat()
    return StaticOverlaySettings.Builder()
      .setScale(sx, sy)
      .setRotationDegrees((-rec.rotationDeg).toFloat())
      .setOverlayFrameAnchor(0f, 0f)
      .setBackgroundFrameAnchor(bgX, bgY)
      .build()
  }

  private fun buildOverlay(rec: OverlayRecord, outW: Int, outH: Int): TextureOverlay? {
    if (outW <= 0 || outH <= 0) return null
    if (rec.animated) {
      val (frames, durations) = decodeGifFrames(rec.uri) ?: return null
      return GifOverlay(frames, durations, overlaySettings(rec, frames[0].width, frames[0].height, outW, outH))
    }
    val bmp = loadBitmap(rec.uri) ?: return null
    if (bmp.width <= 0 || bmp.height <= 0) return null
    return BitmapOverlay.createStaticBitmapOverlay(bmp, overlaySettings(rec, bmp.width, bmp.height, outW, outH))
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
