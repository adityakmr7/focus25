import Foundation
import WidgetKit

@objc(WidgetDataManager)
class WidgetDataManager: NSObject {
    
    private let userDefaults = UserDefaults(suiteName: "group.com.focus25.timer")
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func updateTimerData(_ timerState: String,
                              timeRemaining: NSNumber,
                              isBreak: Bool,
                              sessionCount: NSNumber,
                              dailyMinutes: NSNumber) {
        
        userDefaults?.set(timerState, forKey: "timerState")
        userDefaults?.set(timeRemaining.intValue, forKey: "timeRemaining")
        userDefaults?.set(isBreak, forKey: "isBreak")
        userDefaults?.set(sessionCount.intValue, forKey: "sessionCount")
        userDefaults?.set(dailyMinutes.intValue, forKey: "dailyMinutes")
        
        // Update timestamp for the current day
        let calendar = Calendar.current
        let today = Date()
        if let dayStart = calendar.dateInterval(of: .day, for: today)?.start {
            let dayKey = "stats_\(dayStart.timeIntervalSince1970)"
            userDefaults?.set(dailyMinutes.intValue, forKey: dayKey)
        }
        
        userDefaults?.synchronize()
        
        // Reload all timelines
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    @objc func updateDailyStats(_ date: String, minutes: NSNumber, sessions: NSNumber) {
        let dayKey = "stats_\(date)"
        userDefaults?.set(minutes.intValue, forKey: dayKey)
        userDefaults?.set(sessions.intValue, forKey: "sessionCount_\(date)")
        userDefaults?.synchronize()
        
        WidgetCenter.shared.reloadTimelines(ofKind: "StatsWidget")
    }
}