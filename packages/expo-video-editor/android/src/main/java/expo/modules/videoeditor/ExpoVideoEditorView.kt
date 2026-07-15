package expo.modules.videoeditor

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/** Prop-driven ExoPlayer preview. Loops within [loopStart, loopEnd] and reports progress/metadata. */
@UnstableApi
class ExpoVideoEditorView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onLoad by EventDispatcher<Map<String, Any>>()
  private val onProgress by EventDispatcher<Map<String, Any>>()
  private val onEnded by EventDispatcher<Map<String, Any>>()

  private val exo = ExoPlayer.Builder(context).build()
  private val playerView = PlayerView(context).apply {
    useController = false
    player = exo
  }

  private var loopStartMs: Long = 0
  private var loopEndMs: Long = 0
  private var lastSeekSeq: Int = -1
  private var didEmitLoad = false

  private val handler = Handler(Looper.getMainLooper())
  private val ticker = object : Runnable {
    override fun run() {
      val pos = exo.currentPosition
      val end = if (loopEndMs > 0) loopEndMs else exo.duration
      if (end > 0 && pos >= end) {
        exo.seekTo(if (loopStartMs > 0) loopStartMs else 0)
      }
      onProgress(mapOf("positionMs" to pos.toDouble()))
      handler.postDelayed(this, 50)
    }
  }

  init {
    addView(playerView)
    exo.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(state: Int) {
        if (state == Player.STATE_READY && !didEmitLoad) {
          didEmitLoad = true
          val vs: VideoSize = exo.videoSize
          onLoad(
            mapOf(
              "durationMs" to exo.duration.coerceAtLeast(0).toDouble(),
              "width" to vs.width,
              "height" to vs.height,
              "rotationDeg" to vs.unappliedRotationDegrees
            )
          )
        }
        if (state == Player.STATE_ENDED) onEnded(emptyMap())
      }
    })
    handler.post(ticker)
  }

  fun setSource(uri: String) {
    if (uri.isEmpty()) return
    didEmitLoad = false
    exo.setMediaItem(MediaItem.fromUri(Uri.parse(uri)))
    exo.prepare()
  }

  fun setPaused(paused: Boolean) {
    exo.playWhenReady = !paused
  }

  fun setLoopStart(ms: Long) {
    loopStartMs = ms
  }

  fun setLoopEnd(ms: Long) {
    loopEndMs = ms
  }

  fun seekTo(positionMs: Long, seq: Int) {
    if (seq == lastSeekSeq) return
    lastSeekSeq = seq
    exo.seekTo(positionMs.coerceAtLeast(0))
  }

  fun setColorMatrix(matrix: List<Double>) {
    if (matrix.size >= 20) {
      exo.setVideoEffects(listOf(ColorMatrixEffect(FloatArray(20) { matrix[it].toFloat() })))
    } else {
      exo.setVideoEffects(emptyList())
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    handler.removeCallbacks(ticker)
    exo.release()
  }
}
