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

### iOS

1. **Configure app.json** with your bundle identifier
2. **Build the app**:
   ```bash
   expo build:ios
   ```
   Or use EAS Build:
   ```bash
   eas build --platform ios
   ```

### Android

1. **Configure app.json** with your package name
2. **Build the app**:
   ```bash
   expo build:android
   ```
   Or use EAS Build:
   ```bash
   eas build --platform android
   ```

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
