package expo.modules.videoeditor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoVideoEditorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideoEditor")

    Events("onChange")

    Constant("PI") {
      Math.PI
    }

    Function("hello") {
      "Hello world! 👋"
    }

    // Phase 0 liveness probe: proves the JS↔native async bridge end to end.
    AsyncFunction("ping") {
      "ExpoVideoEditor 0.1.0 (android)"
    }

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    View(ExpoVideoEditorView::class) {
      // Defines an event that the view can send to JavaScript.
      Events("onTap")
    }
  }
}
