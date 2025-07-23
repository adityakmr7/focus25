import WidgetKit
import SwiftUI
import Charts

struct StatsProvider: TimelineProvider {
    func placeholder(in context: Context) -> StatsEntry {
        StatsEntry(date: Date(), weeklyData: sampleWeeklyData(), todayStats: sampleTodayStats())
    }

    func getSnapshot(in context: Context, completion: @escaping (StatsEntry) -> ()) {
        let entry = StatsEntry(date: Date(), weeklyData: sampleWeeklyData(), todayStats: sampleTodayStats())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        let statsData = getStatsData()
        
        let entry = StatsEntry(
            date: currentDate,
            weeklyData: statsData.weeklyData,
            todayStats: statsData.todayStats
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
    
    private func getStatsData() -> (weeklyData: [DayData], todayStats: TodayStats) {
        let userDefaults = UserDefaults(suiteName: "group.com.focus25.timer")
        
        var weeklyData: [DayData] = []
        let calendar = Calendar.current
        let today = Date()
        
        for i in 0..<7 {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                let dayKey = "stats_\(calendar.dateInterval(of: .day, for: date)?.start.timeIntervalSince1970 ?? 0)"
                let minutes = userDefaults?.integer(forKey: dayKey) ?? (i == 0 ? 180 : Int.random(in: 0...300))
                let dayName = DateFormatter().shortWeekdaySymbols[calendar.component(.weekday, from: date) - 1]
                weeklyData.append(DayData(day: dayName, minutes: minutes))
            }
        }
        
        let todayMinutes = userDefaults?.integer(forKey: "dailyMinutes") ?? 180
        let todaySessions = userDefaults?.integer(forKey: "sessionCount") ?? 5
        let weeklyAverage = weeklyData.map { $0.minutes }.reduce(0, +) / 7
        
        let todayStats = TodayStats(
            minutes: todayMinutes,
            sessions: todaySessions,
            weeklyAverage: weeklyAverage
        )
        
        return (weeklyData.reversed(), todayStats)
    }
}

struct StatsEntry: TimelineEntry {
    let date: Date
    let weeklyData: [DayData]
    let todayStats: TodayStats
}

struct DayData: Identifiable {
    let id = UUID()
    let day: String
    let minutes: Int
}

struct TodayStats {
    let minutes: Int
    let sessions: Int
    let weeklyAverage: Int
}

struct StatsWidgetEntryView: View {
    var entry: StatsProvider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemMedium:
            MediumStatsView(entry: entry)
        case .systemLarge:
            LargeStatsView(entry: entry)
        default:
            MediumStatsView(entry: entry)
        }
    }
}

struct MediumStatsView: View {
    let entry: StatsEntry
    
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    colors: [Color.purple.opacity(0.8), Color.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                    
                    Text("Weekly Stats")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                }
                
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(entry.todayStats.minutes)")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Minutes Today")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("\(entry.todayStats.sessions)")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Sessions")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                
                HStack {
                    Text("Avg: \(entry.todayStats.weeklyAverage)min")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                    
                    Spacer()
                    
                    if entry.todayStats.minutes > entry.todayStats.weeklyAverage {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.green)
                    } else if entry.todayStats.minutes < entry.todayStats.weeklyAverage {
                        Image(systemName: "arrow.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.red)
                    } else {
                        Image(systemName: "minus")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
            }
            .padding(16)
        }
    }
}

struct LargeStatsView: View {
    let entry: StatsEntry
    
    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    colors: [Color.purple.opacity(0.8), Color.purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
            
            VStack(spacing: 16) {
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.white)
                    
                    Text("Weekly Progress")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Text("Focus25")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                if #available(iOS 16.0, *) {
                    Chart(entry.weeklyData) { data in
                        BarMark(
                            x: .value("Day", data.day),
                            y: .value("Minutes", data.minutes)
                        )
                        .foregroundStyle(Color.white.opacity(0.9))
                        .cornerRadius(4)
                    }
                    .chartYAxis {
                        AxisMarks(position: .leading) { _ in
                            AxisGridLine()
                                .foregroundStyle(Color.white.opacity(0.3))
                            AxisValueLabel()
                                .foregroundStyle(Color.white.opacity(0.8))
                                .font(.system(size: 10))
                        }
                    }
                    .chartXAxis {
                        AxisMarks { _ in
                            AxisValueLabel()
                                .foregroundStyle(Color.white.opacity(0.8))
                                .font(.system(size: 10, weight: .medium))
                        }
                    }
                    .frame(height: 120)
                } else {
                    SimpleBarChart(data: entry.weeklyData)
                        .frame(height: 120)
                }
                
                HStack(spacing: 32) {
                    VStack(spacing: 4) {
                        Text("\(entry.todayStats.minutes)")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Minutes Today")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    VStack(spacing: 4) {
                        Text("\(entry.todayStats.sessions)")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Sessions")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    VStack(spacing: 4) {
                        Text("\(entry.todayStats.weeklyAverage)")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Weekly Avg")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
            .padding(20)
        }
    }
}

struct SimpleBarChart: View {
    let data: [DayData]
    
    var body: some View {
        let maxMinutes = data.map { $0.minutes }.max() ?? 0
        
        HStack(alignment: .bottom, spacing: 8) {
            ForEach(data) { dayData in
                VStack(spacing: 4) {
                    Rectangle()
                        .fill(Color.white.opacity(0.9))
                        .frame(width: 20, height: max(CGFloat(dayData.minutes) / CGFloat(maxMinutes) * 80, 2))
                        .cornerRadius(2)
                    
                    Text(dayData.day)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
        }
    }
}

private func sampleWeeklyData() -> [DayData] {
    [
        DayData(day: "Mon", minutes: 240),
        DayData(day: "Tue", minutes: 180),
        DayData(day: "Wed", minutes: 300),
        DayData(day: "Thu", minutes: 150),
        DayData(day: "Fri", minutes: 220),
        DayData(day: "Sat", minutes: 90),
        DayData(day: "Sun", minutes: 180)
    ]
}

private func sampleTodayStats() -> TodayStats {
    TodayStats(minutes: 180, sessions: 5, weeklyAverage: 194)
}

struct StatsWidget: Widget {
    let kind: String = "StatsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
            StatsWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Focus Stats")
        .description("View your weekly focus statistics and progress")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

#Preview(as: .systemMedium) {
    StatsWidget()
} timeline: {
    StatsEntry(date: .now, weeklyData: sampleWeeklyData(), todayStats: sampleTodayStats())
}

#Preview(as: .systemLarge) {
    StatsWidget()
} timeline: {
    StatsEntry(date: .now, weeklyData: sampleWeeklyData(), todayStats: sampleTodayStats())
}