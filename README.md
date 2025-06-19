# Focus 25 - Advanced Productivity Timer

A production-ready React Native app built with Expo that helps users achieve deep focus through intelligent timer management, flow state tracking, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Smart Pomodoro Timer** with adaptive session lengths
- **Background Timer Support** - continues running when app is backgrounded
- **Flow State Tracking** with real-time intensity monitoring
- **Comprehensive Analytics** with detailed insights and trends
- **Goal Setting & Achievement** system with progress tracking
- **Focus Music Player** with curated ambient sounds

### Advanced Features
- **Onboarding Flow** for new users
- **Notification System** with smart reminders and achievements
- **Data Persistence** with SQLite database
- **Error Handling & Logging** for production reliability
- **Performance Optimization** with memoization and lazy loading
- **Theme Customization** with light/dark modes and custom colors
- **Export/Import** functionality for data backup

### Technical Highlights
- **Background Processing** using Expo Background Fetch and Task Manager
- **Real-time Animations** with React Native Reanimated
- **Comprehensive State Management** using Zustand
- **Type Safety** with TypeScript throughout
- **Production Error Handling** with crash reporting integration
- **Performance Monitoring** and optimization

## 📱 Screenshots

*Screenshots would be added here showing the main timer interface, analytics dashboard, goal tracking, and settings screens.*

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation 7
- **State Management**: Zustand
- **Database**: Expo SQLite
- **Animations**: React Native Reanimated 3
- **Audio**: Expo Audio
- **Notifications**: Expo Notifications
- **Background Tasks**: Expo Background Fetch & Task Manager
- **Styling**: NativeWind (Tailwind CSS)
- **Charts**: React Native Chart Kit
- **Icons**: Expo Vector Icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flow-focus.git
cd flow-focus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android  
npm run android

# Web
npm run web
```

## 📊 App Architecture

### State Management
The app uses Zustand for state management with the following stores:
- `pomodoroStore` - Timer state and flow metrics
- `settingsStore` - User preferences and configuration
- `statisticsStore` - Usage analytics and historical data
- `goalsStore` - Goal tracking and achievement system
- `themeStore` - Theme customization and appearance

### Database Schema
SQLite database with the following main tables:
- `goals` - User goals and progress tracking
- `statistics` - Daily/weekly/monthly usage statistics
- `flow_metrics` - Flow state tracking and analytics
- `settings` - User preferences and configuration
- `theme` - Theme customization data

### Background Processing
- **Background Timer**: Continues timing sessions when app is backgrounded
- **Notification Scheduling**: Smart notifications for session completion and reminders
- **Data Sync**: Periodic synchronization of local data

## 🎯 Key Features Deep Dive

### Smart Timer System
- Adaptive session lengths based on flow state
- Background processing for uninterrupted timing
- Smart break recommendations
- Session completion tracking

### Flow State Analytics
- Real-time flow intensity monitoring
- Distraction tracking and analysis
- Productivity pattern recognition
- Personalized insights and recommendations

### Goal Achievement System
- SMART goal framework implementation
- Progress visualization and tracking
- Achievement celebrations and notifications
- Goal completion analytics

### Advanced Analytics
- Interactive charts and visualizations
- Time-based trend analysis
- Productivity heatmaps
- Comparative performance metrics

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Notification Setup
The app automatically requests notification permissions and sets up:
- Session completion alerts
- Break reminders
- Daily focus reminders
- Achievement notifications
- Weekly progress reports

### Background Processing Setup
Background tasks are automatically configured for:
- Timer continuation when app is backgrounded
- Periodic data synchronization
- Notification scheduling

## 📈 Performance Optimizations

- **Memoized Components** for expensive renders
- **Lazy Loading** for heavy components
- **Optimized FlatLists** with proper item sizing
- **Debounced Inputs** for search and filters
- **Batch State Updates** to minimize re-renders
- **Memory Monitoring** in development mode

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📦 Building for Production

### Development Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

## 🚀 Deployment

### App Store Deployment
1. Build production iOS app using EAS
2. Upload to App Store Connect
3. Submit for review

### Google Play Deployment  
1. Build production Android app using EAS
2. Upload to Google Play Console
3. Submit for review

### Web Deployment
```bash
# Build for web
npx expo export:web

# Deploy to your preferred hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the excellent development platform
- React Native community for the robust ecosystem
- Contributors and beta testers

## 📞 Support

For support, email support@flowfocus.app or join our Discord community.

## 🗺 Roadmap

### Version 1.1
- [ ] Apple Watch companion app
- [ ] Siri Shortcuts integration
- [ ] Advanced focus music library
- [ ] Team collaboration features

### Version 1.2
- [ ] AI-powered focus recommendations
- [ ] Integration with calendar apps
- [ ] Advanced reporting dashboard
- [ ] Social features and challenges

### Version 2.0
- [ ] Desktop companion app
- [ ] Advanced biometric integration
- [ ] Enterprise features
- [ ] API for third-party integrations

---

**Focus 25** - Transform your productivity with intelligent focus tracking and analytics.
