import ExpoModulesCore
import WidgetKit
import ActivityKit
import Foundation

// Live Activity Attributes for iOS 16.1+
@available(iOS 16.1, *)
public struct focus25WidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public let timeRemaining: String
        public let progress: Double
        public let isActive: Bool
        
        public init(timeRemaining: String, progress: Double, isActive: Bool) {
            self.timeRemaining = timeRemaining
            self.progress = progress
            self.isActive = isActive
        }
    }
    
    public let sessionName: String
    public let totalDuration: Int
    
    public init(sessionName: String, totalDuration: Int) {
        self.sessionName = sessionName
        self.totalDuration = totalDuration
    }
}

public class Focus25WidgetModule: Module {
  // Default app group identifier - should be configured by the app
  private var appGroupId = "group.com.focus25.app.focus25Widget"
  private let widgetKind = "focus25Widget"

  public func definition() -> ModuleDefinition {
    Name("Focus25WidgetModule")

    AsyncFunction("updateWidget") { (data: [String: Any]) -> Void in
      let sharedDefaults = UserDefaults(suiteName: self.appGroupId)

      // Store timer data
      let sessionName = data["sessionName"] as? String ?? "Focus Session"
      let timeRemaining = data["timeRemaining"] as? String ?? "25:00"
      let isActive = data["isActive"] as? Bool ?? false
      let progress = data["progress"] as? Double ?? 0.0
      let totalDuration = data["totalDuration"] as? Int ?? 1500
      let elapsedTime = data["elapsedTime"] as? Int ?? 0
      
      // Store todo data
      let todayCompletedTodos = data["todayCompletedTodos"] as? Int ?? 0
      let todayTotalTodos = data["todayTotalTodos"] as? Int ?? 0
      
      sharedDefaults?.set(sessionName, forKey: "sessionName")
      sharedDefaults?.set(timeRemaining, forKey: "timeRemaining")
      sharedDefaults?.set(isActive, forKey: "isActive")
      sharedDefaults?.set(progress, forKey: "progress")
      sharedDefaults?.set(totalDuration, forKey: "totalDuration")
      sharedDefaults?.set(elapsedTime, forKey: "elapsedTime")
      sharedDefaults?.set(todayCompletedTodos, forKey: "todayCompletedTodos")
      sharedDefaults?.set(todayTotalTodos, forKey: "todayTotalTodos")

      // Store last update timestamp
      sharedDefaults?.set(Date().timeIntervalSince1970, forKey: "lastUpdate")

      // Force synchronize
      sharedDefaults?.synchronize()

      // Reload all widget timelines
      WidgetCenter.shared.reloadAllTimelines()
      WidgetCenter.shared.reloadTimelines(ofKind: self.widgetKind)
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
      sharedDefaults?.removeObject(forKey: "todayCompletedTodos")
      sharedDefaults?.removeObject(forKey: "todayTotalTodos")
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
        "todayCompletedTodos": sharedDefaults?.integer(forKey: "todayCompletedTodos") ?? 0,
        "todayTotalTodos": sharedDefaults?.integer(forKey: "todayTotalTodos") ?? 0,
        "lastUpdate": sharedDefaults?.double(forKey: "lastUpdate") ?? 0
      ]
    }

    AsyncFunction("startLiveActivity") { (data: [String: Any]) -> Void in
      if #available(iOS 16.1, *) {
        let attributes = focus25WidgetAttributes(
          sessionName: data["sessionName"] as? String ?? "Focus Session",
          totalDuration: data["totalDuration"] as? Int ?? 1500
        )
        
        let contentState = focus25WidgetAttributes.ContentState(
          timeRemaining: data["timeRemaining"] as? String ?? "25:00",
          progress: data["progress"] as? Double ?? 0.0,
          isActive: data["isActive"] as? Bool ?? false
        )
        
        do {
          let activity = try Activity<focus25WidgetAttributes>.request(
            attributes: attributes,
            contentState: contentState
          )
        } catch {
          // Live Activity failed to start
        }
      }
    }

    AsyncFunction("updateLiveActivity") { (data: [String: Any]) -> Void in
      if #available(iOS 16.1, *) {
        let contentState = focus25WidgetAttributes.ContentState(
          timeRemaining: data["timeRemaining"] as? String ?? "25:00",
          progress: data["progress"] as? Double ?? 0.0,
          isActive: data["isActive"] as? Bool ?? false
        )
        
        Task {
          for activity in Activity<focus25WidgetAttributes>.activities {
            await activity.update(using: contentState)
          }
        }
      }
    }

    AsyncFunction("stopLiveActivity") { () -> Void in
      if #available(iOS 16.1, *) {
        Task {
          for activity in Activity<focus25WidgetAttributes>.activities {
            await activity.end(dismissalPolicy: .immediate)
          }
        }
      }
    }
  }
}
