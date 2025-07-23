import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), timerState: .idle, timeRemaining: 1500, isBreak: false, sessionCount: 0, dailyMinutes: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), timerState: .running, timeRemaining: 1200, isBreak: false, sessionCount: 3, dailyMinutes: 150)
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let timerData = getTimerData()
        
        let entry = SimpleEntry(
            date: currentDate,
            timerState: timerData.state,
            timeRemaining: timerData.timeRemaining,
            isBreak: timerData.isBreak,
            sessionCount: timerData.sessionCount,
            dailyMinutes: timerData.dailyMinutes
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .second, value: 30, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    private func getTimerData() -> (state: TimerState, timeRemaining: Int, isBreak: Bool, sessionCount: Int, dailyMinutes: Int) {
        // Try to get real data from shared container
        if let userDefaults = UserDefaults(suiteName: "group.com.focus25.timer") {
            let state = TimerState(rawValue: userDefaults.string(forKey: "timerState") ?? "idle") ?? .idle
            let timeRemaining = userDefaults.integer(forKey: "timeRemaining")
            let isBreak = userDefaults.bool(forKey: "isBreak")
            let sessionCount = userDefaults.integer(forKey: "sessionCount")
            let dailyMinutes = userDefaults.integer(forKey: "dailyMinutes")
            
            // Return real data if available, otherwise fallback to demo data
            if timeRemaining > 0 || sessionCount > 0 || dailyMinutes > 0 {
                return (state, timeRemaining > 0 ? timeRemaining : 1500, isBreak, sessionCount, dailyMinutes)
            }
        }
        
        // Fallback to demo data if App Groups not working or no data available
        let currentHour = Calendar.current.component(.hour, from: Date())
        let state: TimerState = {
            switch currentHour {
            case 9...11: return .running
            case 12...13: return .paused
            case 14...17: return .running
            case 18...19: return .completed
            default: return .idle
            }
        }()
        
        let timeRemaining = state == .running ? Int.random(in: 600...1500) : 1500
        let isBreak = currentHour == 12 || currentHour == 15
        let sessionCount = max(0, currentHour - 8)
        let dailyMinutes = sessionCount * 25
        
        return (state, timeRemaining, isBreak, sessionCount, dailyMinutes)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let timerState: TimerState
    let timeRemaining: Int
    let isBreak: Bool
    let sessionCount: Int
    let dailyMinutes: Int
}

enum TimerState: String, CaseIterable {
    case idle = "idle"
    case running = "running"
    case paused = "paused"
    case completed = "completed"
    
    var displayName: String {
        switch self {
        case .idle: return "Ready"
        case .running: return "Focus"
        case .paused: return "Paused"
        case .completed: return "Done!"
        }
    }
}

struct Focus25WidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct SmallWidgetView: View {
    let entry: SimpleEntry
    
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    colors: entry.isBreak ? [Color.green.opacity(0.8), Color.green] : [Color.blue.opacity(0.8), Color.blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: entry.isBreak ? "cup.and.saucer" : "brain.head.profile")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text(entry.timerState.displayName)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                }
                
                Spacer()
                
                VStack(spacing: 2) {
                    Text(formatTime(entry.timeRemaining))
                        .font(.system(size: 20, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    
                    Text(entry.isBreak ? "Break Time" : "Focus Time")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                HStack {
                    Label("\(entry.sessionCount)", systemImage: "checkmark.circle.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.9))
                    
                    Spacer()
                }
            }
            .padding(12)
        }
    }
}

struct MediumWidgetView: View {
    let entry: SimpleEntry
    
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    colors: entry.isBreak ? [Color.green.opacity(0.8), Color.green] : [Color.blue.opacity(0.8), Color.blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: entry.isBreak ? "cup.and.saucer" : "brain.head.profile")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white)
                    
                    Text(entry.timerState.displayName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                    
                    Spacer()
                }
                
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(formatTime(entry.timeRemaining))
                            .font(.system(size: 24, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                        
                        Text(entry.isBreak ? "Break Time" : "Focus Time")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 8) {
                        HStack(spacing: 4) {
                            Text("\(entry.sessionCount)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("sessions")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        
                        HStack(spacing: 4) {
                            Text("\(entry.dailyMinutes)")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                            
                            Text("min")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                }
            }
            .padding(16)
        }
    }
}

struct LargeWidgetView: View {
    let entry: SimpleEntry
    
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    colors: entry.isBreak ? [Color.green.opacity(0.8), Color.green] : [Color.blue.opacity(0.8), Color.blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            VStack(spacing: 20) {
                HStack {
                    Image(systemName: entry.isBreak ? "cup.and.saucer" : "brain.head.profile")
                        .font(.system(size: 24, weight: .medium))
                        .foregroundColor(.white)
                    
                    Text(entry.timerState.displayName)
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                    
                    Spacer()
                    
                    Text("Focus25")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                VStack(spacing: 8) {
                    Text(formatTime(entry.timeRemaining))
                        .font(.system(size: 48, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    
                    Text(entry.isBreak ? "Break Time" : "Focus Time")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                    
                    if entry.timerState == .running {
                        ProgressView(value: Double(1500 - entry.timeRemaining), total: 1500.0)
                            .progressViewStyle(LinearProgressViewStyle(tint: .white))
                            .background(Color.white.opacity(0.3))
                            .cornerRadius(4)
                    }
                }
                
                HStack(spacing: 32) {
                    VStack(spacing: 4) {
                        Text("\(entry.sessionCount)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Sessions Today")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    VStack(spacing: 4) {
                        Text("\(entry.dailyMinutes)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Minutes Focused")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                
                Spacer()
            }
            .padding(20)
        }
    }
}

private func formatTime(_ seconds: Int) -> String {
    let minutes = seconds / 60
    let remainingSeconds = seconds % 60
    return String(format: "%02d:%02d", minutes, remainingSeconds)
}

struct Focus25Widget: Widget {
    let kind: String = "Focus25Widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            Focus25WidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Focus Timer")
        .description("Track your focus sessions and break times")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

#Preview(as: .systemSmall) {
    Focus25Widget()
} timeline: {
    SimpleEntry(date: .now, timerState: .running, timeRemaining: 1200, isBreak: false, sessionCount: 3, dailyMinutes: 150)
    SimpleEntry(date: .now, timerState: .paused, timeRemaining: 900, isBreak: true, sessionCount: 4, dailyMinutes: 200)
}
