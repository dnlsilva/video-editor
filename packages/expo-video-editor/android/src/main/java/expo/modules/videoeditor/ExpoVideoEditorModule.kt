package expo.modules.videoeditor

import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

@UnstableApi
class ExpoVideoEditorModule : Module() {
  private var exportRunner: ExportRunner? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoVideoEditor")

    Events("onExportProgress")

    AsyncFunction("ping") {
      "ExpoVideoEditor 0.1.0 (android)"
    }

    AsyncFunction("exportVideo") { payload: ExportPayload, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("EXPORT_FAILED", "No React context available", null)
        return@AsyncFunction
      }
      val runner = ExportRunner(context) { progress ->
        sendEvent("onExportProgress", mapOf("progress" to progress))
      }
      exportRunner = runner
      runner.export(payload, promise)
    }

    Function("cancelExport") {
      exportRunner?.cancel()
    }

    View(ExpoVideoEditorView::class) {
      Events("onLoad", "onProgress", "onEnded")

      Prop("source") { view: ExpoVideoEditorView, source: VideoSourceRecord ->
        view.setSource(source.uri)
      }
      Prop("paused") { view: ExpoVideoEditorView, paused: Boolean ->
        view.setPaused(paused)
      }
      Prop("loopStartMs") { view: ExpoVideoEditorView, ms: Int ->
        view.setLoopStart(ms.toLong())
      }
      Prop("loopEndMs") { view: ExpoVideoEditorView, ms: Int ->
        view.setLoopEnd(ms.toLong())
      }
      Prop("seek") { view: ExpoVideoEditorView, seek: SeekRecord ->
        view.seekTo(seek.positionMs.toLong(), seek.seq)
      }
      Prop("colorMatrix") { view: ExpoVideoEditorView, matrix: List<Double> ->
        view.setColorMatrix(matrix)
      }
    }
  }
}
