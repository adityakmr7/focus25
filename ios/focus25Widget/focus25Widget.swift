import WidgetKit
import SwiftUI

struct focus25Widget: Widget {
    let kind: String = "focus25Widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Focus25Provider()) { entry in
            focus25WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Focus25 Timer")
        .description("Track your focus sessions and Pomodoro timer")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct Focus25Entry: TimelineEntry {
    let date: Date
    let sessionName: String
    let timeRemaining: String
    let isActive: Bool
    let progress: Double
    let totalDuration: Int
    let elapsedTime: Int
}

struct Focus25Provider: TimelineProvider {
    func placeholder(in context: Context) -> Focus25Entry {
        Focus25Entry(
            date: Date(),
            sessionName: "Focus Session",
            timeRemaining: "25:00",
            isActive: false,
            progress: 0.0,
            totalDuration: 1500,
            elapsedTime: 0
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (Focus25Entry) -> ()) {
        let entry = getWidgetData()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getWidgetData()
        
        // Update every 30 seconds when timer is active, every 5 minutes when inactive
        let updateInterval: TimeInterval = entry.isActive ? 30 : 300
        let nextUpdate = Date().addingTimeInterval(updateInterval)
        
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getWidgetData() -> Focus25Entry {
        let sharedDefaults = UserDefaults(suiteName: "group.com.yourcompany.yourapp.widgets")
        
        let sessionName = sharedDefaults?.string(forKey: "sessionName") ?? "Focus Session"
        let timeRemaining = sharedDefaults?.string(forKey: "timeRemaining") ?? "25:00"
        let isActive = sharedDefaults?.bool(forKey: "isActive") ?? false
        let progress = sharedDefaults?.double(forKey: "progress") ?? 0.0
        let totalDuration = sharedDefaults?.integer(forKey: "totalDuration") ?? 1500
        let elapsedTime = sharedDefaults?.integer(forKey: "elapsedTime") ?? 0
        
        return Focus25Entry(
            date: Date(),
            sessionName: sessionName,
            timeRemaining: timeRemaining,
            isActive: isActive,
            progress: progress,
            totalDuration: totalDuration,
            elapsedTime: elapsedTime
        )
    }
}

struct focus25WidgetEntryView: View {
    var entry: Focus25Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct SmallWidgetView: View {
    let entry: Focus25Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                HStack(spacing: 4) {
                    Circle()
                        .fill(entry.isActive ? Color.green : Color.gray)
                        .frame(width: 6, height: 6)
                    
                    Text(entry.isActive ? "ACTIVE" : "READY")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(entry.isActive ? .green : .secondary)
                }
                Spacer()
            }
            
            Spacer()
            
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.timeRemaining)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text(entry.sessionName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            
            // Progress bar
            ProgressView(value: entry.progress)
                .progressViewStyle(LinearProgressViewStyle(tint: entry.isActive ? .blue : .gray))
                .scaleEffect(x: 1, y: 0.5, anchor: .center)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(UIColor.systemBackground))
    }
}

struct MediumWidgetView: View {
    let entry: Focus25Entry
    
    private var formattedDuration: String {
        let minutes = entry.totalDuration / 60
        return "\(minutes) min"
    }
    
    private var completionPercentage: String {
        return String(format: "%.0f%%", entry.progress * 100)
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // Left side - Timer info
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Circle()
                        .fill(entry.isActive ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    
                    Text(entry.isActive ? "FOCUS TIME" : "READY TO FOCUS")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(entry.isActive ? .green : .secondary)
                    
                    Spacer()
                }
                
                Text(entry.timeRemaining)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text(entry.sessionName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                Spacer()
                
                // Progress bar
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Progress")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(completionPercentage)
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                    }
                    
                    ProgressView(value: entry.progress)
                        .progressViewStyle(LinearProgressViewStyle(tint: entry.isActive ? .blue : .gray))
                        .scaleEffect(x: 1, y: 1.2, anchor: .center)
                }
            }
            
            // Right side - Circular progress
            VStack {
                Spacer()
                
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 6)
                        .frame(width: 60, height: 60)
                    
                    Circle()
                        .trim(from: 0, to: entry.progress)
                        .stroke(
                            entry.isActive ? Color.blue : Color.gray,
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .frame(width: 60, height: 60)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 0.5), value: entry.progress)
                    
                    Text(formattedDuration)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(UIColor.systemBackground))
    }
}

// Preview
struct focus25Widget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            focus25WidgetEntryView(entry: Focus25Entry(
                date: Date(),
                sessionName: "Deep Work Session",
                timeRemaining: "18:32",
                isActive: true,
                progress: 0.35,
                totalDuration: 1500,
                elapsedTime: 525
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small - Active")
            
            focus25WidgetEntryView(entry: Focus25Entry(
                date: Date(),
                sessionName: "Deep Work Session",
                timeRemaining: "18:32",
                isActive: true,
                progress: 0.35,
                totalDuration: 1500,
                elapsedTime: 525
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Medium - Active")
            
            focus25WidgetEntryView(entry: Focus25Entry(
                date: Date(),
                sessionName: "Focus Session",
                timeRemaining: "25:00",
                isActive: false,
                progress: 0.0,
                totalDuration: 1500,
                elapsedTime: 0
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small - Inactive")
        }
    }
}
