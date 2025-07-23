# iOS Widget Setup Instructions

## Manual Setup Required

Since widget extensions need to be added through Xcode, follow these steps:

### 1. Add Widget Extension Target

1. Open `Focus25FlowTimerMusic.xcworkspace` in Xcode
2. Select the project in the navigator
3. Click the "+" button at the bottom of the targets list
4. Choose "Widget Extension" from the template list
5. Set the following configuration:
   - Product Name: `Focus25Widget`
   - Bundle Identifier: `com.focus25.timer.widget`
   - Language: Swift
   - Include Configuration Intent: ✓

### 2. Configure App Groups

1. Select the main app target (`Focus25FlowTimerMusic`)
2. Go to "Signing & Capabilities"
3. Add "App Groups" capability
4. Add group: `group.com.focus25.timer`

5. Select the widget extension target (`Focus25Widget`)
6. Go to "Signing & Capabilities"
7. Add "App Groups" capability
8. Add the same group: `group.com.focus25.timer`

### 3. Replace Widget Files

Replace the generated widget files with the ones we created:

- Replace `Focus25Widget/Focus25Widget.swift` with our custom implementation
- Replace `Focus25Widget/Focus25WidgetBundle.swift` with our bundle
- Add `Focus25Widget/StatsWidget.swift` to the widget target
- Replace `Focus25Widget/Info.plist` with our configuration

### 4. Add Native Module Files

Add these files to the main app target:

- `Focus25FlowTimerMusic/WidgetDataManager.swift`
- `Focus25FlowTimerMusic/WidgetDataManager.m`

Make sure to:
- Add both files to the main app target
- Add `WidgetDataManager.swift` to the bridging header

### 5. Update Bridging Header

Add this line to `Focus25FlowTimerMusic-Bridging-Header.h`:

```objc
#import "WidgetDataManager.h"
```

### 6. Build and Test

1. Build the project to ensure everything compiles
2. Install on device/simulator
3. Add widgets to home screen through the widget gallery

## Widget Features

### Focus Timer Widget (Small/Medium/Large)
- Shows current timer state (Focus/Break/Paused)
- Displays remaining time
- Shows daily session count and minutes
- Color-coded for focus (blue) vs break (green) sessions

### Stats Widget (Medium/Large)
- Weekly progress chart
- Daily statistics
- Comparison with weekly average
- Session count and total minutes

## Data Sharing

The widgets receive data through:
- App Groups shared container
- Updates triggered from React Native via the `WidgetService`
- Automatic refresh every 30 seconds during active timers
- Hourly refresh for statistics

## Troubleshooting

1. **Widgets not updating**: Check App Groups configuration
2. **Build errors**: Ensure all files are added to correct targets
3. **Data not showing**: Verify React Native bridge is working
4. **Permission issues**: Check bundle identifiers match configuration