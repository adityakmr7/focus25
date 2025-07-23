import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Focus25 Widget Configuration" }
    static var description: IntentDescription { "Configure your Focus25 widget settings." }
}
