import ActivityKit
import WidgetKit
import SwiftUI

// Live Activity Attributes for iOS 16.1+
@available(iOS 16.1, *)
struct focus25WidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        let timeRemaining: String
        let progress: Double
        let isActive: Bool
    }
    
    let sessionName: String
    let totalDuration: Int
}

struct focus25WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: focus25WidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            LiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Focus25")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.timeRemaining)
                        .font(.caption)
                        .fontWeight(.semibold)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 4) {
                        Text(context.attributes.sessionName)
                            .font(.caption)
                            .lineLimit(1)
                        
                        ProgressView(value: context.state.progress)
                            .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                    }
                    .padding(.horizontal)
                }
            } compactLeading: {
                Image(systemName: context.state.isActive ? "timer" : "pause.circle")
                    .foregroundColor(context.state.isActive ? .blue : .gray)
            } compactTrailing: {
                Text(context.state.timeRemaining)
                    .font(.caption2)
                    .fontWeight(.semibold)
            } minimal: {
                Image(systemName: "timer")
                    .foregroundColor(context.state.isActive ? .blue : .gray)
            }
            .widgetURL(URL(string: "focus25://timer"))
            .keylineTint(context.state.isActive ? .blue : .gray)
        }
    }
}

struct LiveActivityView: View {
    let context: ActivityViewContext<focus25WidgetAttributes>
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(context.attributes.sessionName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text(context.state.isActive ? "Focus Time Active" : "Timer Paused")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(context.state.timeRemaining)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(context.state.isActive ? .blue : .secondary)
                    
                    Text(String(format: "%.0f%% Complete", context.state.progress * 100))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            ProgressView(value: context.state.progress)
                .progressViewStyle(LinearProgressViewStyle(tint: context.state.isActive ? .blue : .gray))
                .scaleEffect(x: 1, y: 1.5, anchor: .center)
        }
        .padding(16)
        .background(Color(UIColor.systemBackground))
    }
}

extension focus25WidgetAttributes {
    fileprivate static var preview: focus25WidgetAttributes {
        focus25WidgetAttributes(sessionName: "Deep Work", totalDuration: 1500)
    }
}

extension focus25WidgetAttributes.ContentState {
    fileprivate static var active: focus25WidgetAttributes.ContentState {
        focus25WidgetAttributes.ContentState(timeRemaining: "18:32", progress: 0.35, isActive: true)
    }
    
    fileprivate static var paused: focus25WidgetAttributes.ContentState {
        focus25WidgetAttributes.ContentState(timeRemaining: "25:00", progress: 0.0, isActive: false)
    }
}

#Preview("Notification", as: .content, using: focus25WidgetAttributes.preview) {
   focus25WidgetLiveActivity()
} contentStates: {
    focus25WidgetAttributes.ContentState.active
    focus25WidgetAttributes.ContentState.paused
}
