import ExpoModulesCore
import WidgetKit
import Foundation

public class Focus25WidgetModuleModule: Module {
  // Default app group identifier - should be configured by the app
  private var appGroupId = "com.focus25.app.focus25Widget"
  private let widgetKind = "focus25Widget"

  public func definition() -> ModuleDefinition {
    Name("Focus25WidgetModule")

    AsyncFunction("updateWidget") { (data: [String: Any]) -> Void in
      let sharedDefaults = UserDefaults(suiteName: self.appGroupId)

      // Store timer data
      sharedDefaults?.set(data["sessionName"] as? String ?? "Focus Session", forKey: "sessionName")
      sharedDefaults?.set(data["timeRemaining"] as? String ?? "25:00", forKey: "timeRemaining")
      sharedDefaults?.set(data["isActive"] as? Bool ?? false, forKey: "isActive")
      sharedDefaults?.set(data["progress"] as? Double ?? 0.0, forKey: "progress")
      sharedDefaults?.set(data["totalDuration"] as? Int ?? 1500, forKey: "totalDuration") // 25 minutes default
      sharedDefaults?.set(data["elapsedTime"] as? Int ?? 0, forKey: "elapsedTime")

      // Store last update timestamp
      sharedDefaults?.set(Date().timeIntervalSince1970, forKey: "lastUpdate")

      // Force synchronize
      sharedDefaults?.synchronize()

      // Reload all widget timelines
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("reloadWidgets") { () -> Void in
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("configureWidget") { (config: [String: Any]) -> Void in
      if let appGroupId = config["appGroupId"] as? String {
        self.appGroupId = appGroupId
      }
    }

    AsyncFunction("clearWidgetData") { () -> Void in
      let sharedDefaults = UserDefaults(suiteName: self.appGroupId)

      sharedDefaults?.removeObject(forKey: "sessionName")
      sharedDefaults?.removeObject(forKey: "timeRemaining")
      sharedDefaults?.removeObject(forKey: "isActive")
      sharedDefaults?.removeObject(forKey: "progress")
      sharedDefaults?.removeObject(forKey: "totalDuration")
      sharedDefaults?.removeObject(forKey: "elapsedTime")
      sharedDefaults?.removeObject(forKey: "lastUpdate")

      sharedDefaults?.synchronize()

      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("getWidgetData") { () -> [String: Any]? in
      let sharedDefaults = UserDefaults(suiteName: self.appGroupId)

      guard let sessionName = sharedDefaults?.string(forKey: "sessionName") else {
        return nil
      }

      return [
        "sessionName": sessionName,
        "timeRemaining": sharedDefaults?.string(forKey: "timeRemaining") ?? "25:00",
        "isActive": sharedDefaults?.bool(forKey: "isActive") ?? false,
        "progress": sharedDefaults?.double(forKey: "progress") ?? 0.0,
        "totalDuration": sharedDefaults?.integer(forKey: "totalDuration") ?? 1500,
        "elapsedTime": sharedDefaults?.integer(forKey: "elapsedTime") ?? 0,
        "lastUpdate": sharedDefaults?.double(forKey: "lastUpdate") ?? 0
      ]
    }
  }
}
