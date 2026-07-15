import ExpoModulesCore

public class ExpoVideoEditorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoVideoEditor")

    Events("onChange")

    Constant("PI") {
      Double.pi
    }

    Function("hello") {
      return "Hello world! 👋"
    }

    // Phase 0 liveness probe: proves the JS↔native async bridge end to end.
    AsyncFunction("ping") {
      return "ExpoVideoEditor 0.1.0 (ios)"
    }

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }

    View(ExpoVideoEditorView.self) {
      Events("onTap")
    }
  }
}
