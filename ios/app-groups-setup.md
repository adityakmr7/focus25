# App Groups Setup Guide

## If App Groups is Not Available

### Option 1: Check Account Type
1. In Xcode, go to **Xcode** → **Preferences** → **Accounts**
2. Select your Apple ID
3. Check if you have:
   - **Personal Team** (Free) - App Groups not available
   - **Apple Developer Program** ($99/year) - App Groups available

### Option 2: Alternative Setup Without App Groups

If you can't use App Groups, we can modify the widget to work without shared data:

1. **Use static/sample data in widgets**
2. **Use URL schemes to communicate**
3. **Use widget configuration instead of shared data**

## Setup Without App Groups

### 1. Update Widget to Use Sample Data

Replace the `getTimerData()` function in `Focus25Widget.swift`:

```swift
private func getTimerData() -> (state: TimerState, timeRemaining: Int, isBreak: Bool, sessionCount: Int, dailyMinutes: Int) {
    // Since we can't use App Groups, return sample/default data
    // Widget will show a static representation
    return (.running, 1200, false, 3, 150)
}
```

### 2. Make Widget Display Static Information

The widget will show:
- A beautiful timer interface
- Motivational static data
- A button to open the main app

### 3. Remove App Groups References

1. Delete the `Focus25Widget.entitlements` file
2. Remove App Groups capability from both targets (if added)
3. Update the widget service to not try to write shared data

## Alternative: Upgrade to Developer Program

If you want full widget functionality with real-time data:

1. **Join Apple Developer Program** ($99/year)
2. **Go to** https://developer.apple.com/programs/
3. **Enroll** with your Apple ID
4. **Wait for approval** (usually 24-48 hours)
5. **Return to Xcode** and refresh your account

## Quick Test Without App Groups

Let's make the widget work with static data first:

### Update Focus25Widget.swift

```swift
private func getTimerData() -> (state: TimerState, timeRemaining: Int, isBreak: Bool, sessionCount: Int, dailyMinutes: Int) {
    // Static data for demonstration
    let states: [TimerState] = [.running, .paused, .idle]
    let randomState = states.randomElement() ?? .running
    let timeRemaining = Int.random(in: 300...1500)
    let sessionCount = Int.random(in: 0...8)
    let dailyMinutes = sessionCount * 25
    
    return (randomState, timeRemaining, false, sessionCount, dailyMinutes)
}
```

This will create a working widget that:
- ✅ Shows beautiful timer interface
- ✅ Displays random realistic data
- ✅ Updates periodically with new random values
- ✅ Provides a link to open your main app
- ❌ Won't show real-time data from your app

## Check Your Current Setup

To determine which path to take:

1. **In Xcode**, select your main app target
2. **Go to** Signing & Capabilities
3. **Look for** your Team name:
   - If it shows "Personal Team" → Use static data approach
   - If it shows your developer team name → App Groups should be available

Let me know which team type you see, and I'll help you set up the appropriate solution!