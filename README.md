# Flowzy - Pomodoro Focus Timer App

A beautiful, local-first Pomodoro timer application built with React Native and Expo. Flowzy helps you stay focused and productive using the Pomodoro Technique, with comprehensive todo management and session tracking.

## 📱 Features

### Core Features
- **Pomodoro Timer**: Customizable focus and break sessions with 4-session cycles
- **Todo Management**: Create, organize, and track todos with categories, priorities, and time tracking
- **Session History**: Track your Pomodoro sessions and analyze your productivity
- **Local-First Architecture**: All data stored locally with optional cloud sync
- **Apple Sign-In**: Secure authentication with Apple ID
- **Optional Cloud Sync**: Sync your data across devices using Supabase (optional)

### Enhanced Features
- **Smart Notifications**: Get notified when sessions complete
- **Sound Effects**: Audio feedback for timer completion
- **Metronome**: Optional metronome for focus sessions
- **Dark Mode**: Automatic theme switching (light/dark/system)
- **Export/Import**: Backup and restore your data
- **Session Analytics**: Track time spent on each todo item

## 🏗️ Architecture

### Technology Stack
- **Framework**: React Native with Expo (~54.0.0)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Database**: SQLite (local-first) with optional Supabase sync
- **Navigation**: Expo Router (file-based routing)
- **Animations**: React Native Reanimated
- **UI Components**: React Native HeroUI

### Project Structure

```
flowzy/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Todo screen
│   │   ├── pomodoro.tsx     # Pomodoro timer screen
│   │   └── settings.tsx     # Settings screen
│   ├── (create-todo)/       # Create todo modal
│   └── onboarding.tsx       # Onboarding flow
├── components/              # Reusable UI components
├── stores/                  # Zustand state management
│   ├── local-todo-store.ts  # Todo state management
│   ├── pomodoro-store.ts    # Pomodoro timer state
│   ├── auth-store.ts        # Authentication state
│   └── local-settings-store.ts # Settings state
├── services/                # Business logic services
│   ├── local-database-service.ts # SQLite database operations
│   ├── optional-sync-service.ts  # Supabase sync service
│   ├── notification-service.ts   # Push notifications
│   └── apple-auth-service.ts     # Apple authentication
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
├── database/                # Database schemas and migrations
└── docs/                    # Documentation
```

### Local-First Architecture

Flowzy uses a **local-first** approach:
- All data is stored locally in SQLite
- Works offline by default
- Optional cloud sync via Supabase (user-controlled)
- Conflict resolution and sync logging built-in

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for macOS) or Android Emulator
- For iOS development: Xcode 14+
- For Android development: Android Studio

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd focus25
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional, for cloud sync)
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on a device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## 📖 Development Guide

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### State Management

Flowzy uses Zustand for state management. Each feature has its own store:

- **Todo Store** (`stores/local-todo-store.ts`): Manages todos, CRUD operations
- **Pomodoro Store** (`stores/pomodoro-store.ts`): Manages timer state, sessions
- **Auth Store** (`stores/auth-store.ts`): Manages authentication state
- **Settings Store** (`stores/local-settings-store.ts`): Manages app settings

### Database

The app uses SQLite for local storage via `expo-sqlite`. The database service (`services/local-database-service.ts`) handles all database operations.

**Database Schema:**
- `todos` - Todo items with metadata
- `sessions` - Pomodoro session history
- `user_settings` - User preferences
- `sync_log` - Sync tracking (for optional cloud sync)

### Adding New Features

1. **Create a new store** (if needed) in `stores/`
2. **Add service methods** in `services/` if business logic is needed
3. **Create UI components** in `components/` or screen-specific folders
4. **Add routes** in `app/` directory (Expo Router)
5. **Update documentation** in `docs/` if needed

### Testing

Currently, the app doesn't have automated tests. To add testing:

1. Install testing dependencies:
   ```bash
   npm install --save-dev jest @testing-library/react-native
   ```

2. Add test files next to source files with `.test.ts` or `.test.tsx` extension

3. Run tests:
   ```bash
   npm test
   ```

## 🔧 Configuration

### App Configuration

Edit `app.json` for app metadata, icons, splash screens, and permissions.

### Build Configuration

- **iOS**: Configure in `ios/` directory (Xcode project)
- **Android**: Configure in `android/` directory (Gradle files)

### Supabase Configuration (Optional)

Cloud sync is optional. To enable:
1. Create a Supabase project
2. Run database migrations from `database/migrations/`
3. Add credentials to `.env` file
4. Enable sync in app settings

## 📱 Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for cloud-based builds. EAS Build allows you to build iOS and Android apps without requiring local development environments.

### Prerequisites

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```
   If you don't have an account, create one at [expo.dev](https://expo.dev)

3. **Configure your project** (first time only):
   ```bash
   eas build:configure
   ```
   This will create the `eas.json` configuration file (already included in this project).

### Build Profiles

The project includes three build profiles configured in `eas.json`:

- **development**: Development builds with dev client for testing
- **preview**: Internal testing builds (APK for Android, TestFlight for iOS)
- **production**: App Store and Play Store release builds

### Building Your App

#### Quick Build Commands

```bash
# Build for both platforms (interactive)
npm run build

# Build for specific platform
npm run build:ios
npm run build:android

# Build with specific profile
npm run build:dev        # Development build
npm run build:preview    # Preview build (internal testing)
npm run build:production # Production build (store release)
```

#### Detailed Build Options

**Development Build** (for testing with dev client):
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Preview Build** (for internal testing):
```bash
eas build --profile preview --platform ios      # Creates .ipa for TestFlight
eas build --profile preview --platform android  # Creates .apk for internal testing
```

**Production Build** (for App Store/Play Store):
```bash
eas build --profile production --platform ios      # Creates .ipa for App Store
eas build --profile production --platform android  # Creates .aab for Play Store
```

### Managing Credentials

EAS can automatically manage your credentials (certificates, provisioning profiles, keystores):

- **Automatic (Recommended)**: EAS will generate and manage credentials automatically
- **Manual**: You can provide your own credentials if needed

To view or manage credentials:
```bash
eas credentials
```

### Submitting to App Stores

After building, you can submit directly to stores using EAS Submit:

```bash
# Submit iOS app to App Store
eas submit --platform ios --profile production

# Submit Android app to Play Store
eas submit --platform android --profile production
```

**Note**: You'll need to configure store credentials in `eas.json` or use the interactive setup:
```bash
eas submit:configure
```

### Environment Variables

If your app uses environment variables (like Supabase credentials), set them in EAS:

```bash
# Set environment variables for all builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_url

# Or set per-build-profile
eas secret:create --scope build --name EXPO_PUBLIC_SUPABASE_URL --value your_url --type string
```

View secrets:
```bash
eas secret:list
```

### Build Status

Check the status of your builds:
```bash
eas build:list
```

View build logs:
```bash
eas build:view [BUILD_ID]
```

### Local Development vs EAS Build

- **Local Development**: Use `npm run ios` or `npm run android` for quick iteration
- **EAS Build**: Use for production builds, TestFlight, and store submissions

For more information, see the [EAS Build documentation](https://docs.expo.dev/build/introduction/).

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code style**:
   - Use TypeScript strict mode
   - Follow existing code patterns
   - Add comments for complex logic
   - Run `npm run lint` before committing
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow React Native best practices
- Use functional components with hooks
- Keep components small and focused
- Add proper error handling
- Document complex functions

## 📝 Documentation

Additional documentation is available in the `docs/` directory:

- `POMODORO_ARCHITECTURE.md` - Detailed Pomodoro timer architecture
- `NOTIFICATION_SYSTEM.md` - Notification system documentation
- `DATABASE/README.md` - Database schema and migrations
- `QUICK_REFERENCE.md` - Quick reference guide

## 🐛 Troubleshooting

### Common Issues

**Issue**: App won't start
- **Solution**: Clear cache with `expo start -c` or `npm start -- --clear`

**Issue**: Database errors
- **Solution**: Delete app and reinstall to reset database

**Issue**: Sync not working
- **Solution**: Check Supabase credentials in `.env` and verify network connection

**Issue**: Build failures
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- UI components from [React Native HeroUI](https://github.com/gluestack-ui/gluestack-ui)
- State management with [Zustand](https://github.com/pmndrs/zustand)
- Backend (optional) with [Supabase](https://supabase.com)

## 📧 Contact

[Add your contact information]

---

**Version**: 1.7.0  
**Last Updated**: 2025
