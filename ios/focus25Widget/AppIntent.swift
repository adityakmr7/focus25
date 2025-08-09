import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configuration"
    static var description = IntentDescription("This is an example widget.")

    // An example configurable parameter.
    @Parameter(title: "Session Name", default: "Focus Session")
    var sessionName: String
    
    @Parameter(title: "Duration (minutes)", default: 25)
    var duration: Int
}

// App Intent for widget actions
struct StartTimerIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Focus Timer"
    static var description = IntentDescription("Starts a new focus session")
    
    func perform() async throws -> some IntentResult {
        // This will open your app and start the timer
        // You can handle this in your app's URL scheme or deep linking
        return .result()
    }
}

struct PauseTimerIntent: AppIntent {
    static var title: LocalizedStringResource = "Pause Timer"
    static var description = IntentDescription("Pauses the current focus session")
    
    func perform() async throws -> some IntentResult {
        return .result()
    }
}
