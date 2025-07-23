# Widget Troubleshooting Guide

## Error: "Failed to get descriptors for extensionBundleID"

This error typically occurs when the widget extension isn't properly configured in Xcode. Here's how to fix it:

### 1. Check Bundle Identifier Configuration

1. Open your project in Xcode
2. Select the **Focus25Widget** target (not the main app)
3. Go to **General** tab
4. Verify the Bundle Identifier matches: `com.focus25.app.Focus25Widget`
5. Ensure it's a child of your main app's bundle ID

### 2. Verify Target Membership

1. Select each widget file in the Project Navigator:
   - `Focus25Widget.swift`
   - `Focus25WidgetBundle.swift` 
   - `AppIntent.swift`
   - `Info.plist`
   - `Focus25Widget.entitlements`

2. In the File Inspector (right panel), check **Target Membership**
3. Ensure **Focus25Widget** target is checked for all files
4. Ensure **Focus25FlowTimerMusic** (main app) is NOT checked for widget files

### 3. Configure App Groups

**For Main App Target:**
1. Select **Focus25FlowTimerMusic** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability** → **App Groups**
4. Add group: `group.com.focus25.timer`

**For Widget Target:**
1. Select **Focus25Widget** target  
2. Go to **Signing & Capabilities**
3. Click **+ Capability** → **App Groups**
4. Add the same group: `group.com.focus25.timer`

### 4. Clean Build and Restart

1. **Product** → **Clean Build Folder** (⌘+Shift+K)
2. Quit Xcode completely
3. Delete derived data: `~/Library/Developer/Xcode/DerivedData`
4. Restart Xcode
5. Build again

### 5. Reset Simulator (if using simulator)

1. **Device** → **Erase All Content and Settings**
2. Or delete the app from the simulator and reinstall

### 6. Check Signing

1. Make sure both targets use the same **Team** and **Signing Certificate**
2. Ensure **Automatically manage signing** is enabled for both targets
3. Or use the same manual provisioning profile that includes the widget extension

### 7. Verify Info.plist

The widget's `Info.plist` should contain:

```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
</dict>
```

### 8. Runtime Testing

1. Build and run the **main app** first
2. The widget extension will be installed automatically
3. Add the widget through the widget gallery on the home screen
4. Don't try to run the widget target directly - it's an extension

### 9. Alternative Bundle ID Format

If you're still having issues, try using this bundle ID format:
- Main app: `com.focus25.timer` 
- Widget: `com.focus25.timer.widget`

### 10. Xcode Version Compatibility

- This widget uses iOS 16+ features
- Ensure your Xcode version supports WidgetKit (Xcode 12+)
- For interactive widgets, you need Xcode 15+ and iOS 17+

## Testing Checklist

- [ ] Widget target builds without errors
- [ ] Main app builds and runs 
- [ ] App Groups configured for both targets
- [ ] Bundle IDs follow correct hierarchy
- [ ] All widget files have correct target membership
- [ ] Widget appears in iOS widget gallery after main app installation
- [ ] Widget displays data correctly
- [ ] Widget updates when app data changes

## Common Issues

**Widget shows "Unable to Load":**
- Check App Groups configuration
- Verify data is being written to shared container
- Ensure widget timeline provider returns valid data

**Widget doesn't update:**
- Verify `WidgetService` is being called from the main app
- Check that `UserDefaults(suiteName:)` matches between app and widget
- Confirm timeline refresh policy

**Build errors:**
- Clean build folder and derived data
- Check import statements
- Verify all required frameworks are linked