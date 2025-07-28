# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start Expo development server
- `npm run start` - Start Expo development server (alias for dev)
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device  
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint for code quality checks
- `npm run format` - Format code using Prettier

### Build Commands
- `npm run build` - Build the app for production
- `npm run prebuild` - Generate native code before building

## Project Architecture

### Technology Stack
This is a React Native app built with Expo SDK 53 that implements a sophisticated productivity timer with flow state tracking:

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 7 with bottom tabs and native stack
- **State Management**: Zustand stores for different app domains
- **Database**: Hybrid architecture with SQLite (local) and Supabase (remote sync)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Audio**: Expo Audio for focus music and timer sounds
- **Background Processing**: Expo Background Tasks and Task Manager
- **Notifications**: Expo Notifications with smart scheduling

### Core Architecture Patterns

#### State Management Structure
The app uses domain-specific Zustand stores:
- `pomodoroStore` - Timer state, flow metrics, session management
- `settingsStore` - User preferences, timer durations, notification settings
- `statisticsStore` - Usage analytics, historical data, achievements
- `themeStore` - Theme customization, dark/light mode
- `todoStore` - Todo items and task management

#### Database Architecture
Hybrid database pattern in `src/data/`:
- `hybridDatabase.ts` - Main service that routes between local/remote
- `local/localDatabase.ts` - SQLite operations for offline-first functionality
- `remote/supabaseDatabase.ts` - Supabase integration for cloud sync
- `database.ts` - Unified interface that abstracts the hybrid system

#### Component Organization
- `src/screens/` - Main screen components (FlowTimerScreen, SettingsScreen, etc.)
- `src/components/` - Reusable UI components organized by feature
- `src/components/FlowTimerScreen/` - Timer-specific components (Header, TimerContainer, etc.)
- `src/components/TodoScreenComponents/` - Todo-specific components

#### Services Architecture
Background services in `src/services/`:
- `backgroundTimer.ts` - Handles timer continuation when app is backgrounded
- `notificationService.ts` - Smart notifications based on flow state and achievements
- `errorHandler.ts` - Production error logging and crash reporting
- `updateService.ts` - App update detection and user notifications
- `AudioPreloader.ts` - Preloads music tracks for seamless playback

### Key Implementation Details

#### Flow State Tracking
The app implements sophisticated flow state analysis:
- Tracks distraction patterns, session lengths, and consecutive sessions
- Calculates flow intensity ('low', 'medium', 'high') based on multiple factors
- Provides adaptive session length recommendations
- Maintains streak counters and best flow duration records

#### Background Processing
Robust background timer implementation:
- Uses Expo Background Tasks to continue timing when app is backgrounded
- Syncs timer state when app returns to foreground
- Schedules notifications for session completions and break reminders
- Handles app state transitions gracefully

#### Audio System
Integrated focus music player:
- Audio caching system for offline playback (`src/utils/audioCache.ts`)
- Pre-downloads popular tracks during app initialization
- Bottom sheet music player with playback controls
- Supports various ambient sound categories

#### Theme System
Comprehensive theming with NativeWind:
- Light/dark mode with auto-detection
- Custom color schemes defined in `tailwind.config.js`
- Theme store manages user preferences and system sync
- Consistent color tokens across focus/break states

### Development Guidelines

#### App Initialization (Optimized)
The app uses an optimized two-phase initialization system to minimize splash screen time:

**Critical Phase** (blocks splash screen):
1. Font loading
2. Error handler initialization  
3. Database initialization
4. Store initialization (parallel)

**Background Phase** (after splash screen hidden):
1. Background services setup (mobile only)
2. Audio preloading
3. Update checking
4. Notification permissions

Key services:
- `src/services/appInitializer.ts` - Manages the two-phase initialization
- `src/hooks/useAppInitialization.ts` - React hook for initialization state
- `src/services/notificationManager.ts` - Handles notification setup
- `src/hooks/useAppStateHandling.ts` - Manages app state transitions

#### Database Operations
Always use the hybrid database service (`src/data/database.ts`) which automatically routes operations between local SQLite and remote Supabase based on connectivity and user authentication status.

#### Error Handling
Use the centralized error handler (`src/services/errorHandler.ts`) for logging errors with context and severity levels. The app implements graceful degradation for offline scenarios.

#### Background Tasks
When implementing background functionality, use the existing `backgroundTimer.ts` service as a reference. Always handle app state changes and sync appropriately.

#### Testing
The project structure includes test directories but currently has minimal test coverage. When adding tests, place them in `__tests__` directories alongside the source files or in `src/services/__tests__/`.

### Important Notes
- The app supports both iOS and Android with platform-specific optimizations
- Web support is available but with limited functionality (no background tasks)
- Database seeding occurs automatically in development mode
- The app includes comprehensive debugging utilities available in `__DEV__` mode
- Font loading includes the complete SF Pro Display family for iOS-native feel