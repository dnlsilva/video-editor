import ExpoModulesCore

public class ExpoVideoEditorModule: Module {
  private var exportRunner: ExportRunner?

  public func definition() -> ModuleDefinition {
    Name("ExpoVideoEditor")

    Events("onExportProgress")

    AsyncFunction("ping") { () -> String in
      "ExpoVideoEditor 0.1.0 (ios)"
    }

    AsyncFunction("exportVideo") { (payload: ExportPayload, promise: Promise) in
      let runner = ExportRunner()
      self.exportRunner = runner
      runner.export(
        payload,
        onProgress: { [weak self] progress in
          self?.sendEvent("onExportProgress", ["progress": progress])
        },
        resolve: { result in promise.resolve(result) },
        reject: { code, message in promise.reject(code, message) }
      )
    }

    Function("cancelExport") {
      self.exportRunner?.cancel()
    }

    View(ExpoVideoEditorView.self) {
      Events("onLoad", "onProgress", "onEnded")

      Prop("source") { (view: ExpoVideoEditorView, source: VideoSourceRecord) in
        view.setSource(source.uri)
      }
      Prop("paused") { (view: ExpoVideoEditorView, paused: Bool) in
        view.setPaused(paused)
      }
      Prop("loopStartMs") { (view: ExpoVideoEditorView, ms: Int) in
        view.setLoopStart(ms)
      }
      Prop("loopEndMs") { (view: ExpoVideoEditorView, ms: Int) in
        view.setLoopEnd(ms)
      }
      Prop("seek") { (view: ExpoVideoEditorView, seek: SeekRecord) in
        view.seekTo(seq: seek.seq, positionMs: seek.positionMs)
      }
      Prop("colorMatrix") { (view: ExpoVideoEditorView, matrix: [Double]) in
        view.setColorMatrix(matrix)
      }
    }
  }
}
