# Focus25 Design System

A comprehensive design system for the Focus25 productivity timer application, built with React Native and TypeScript.

## 🎨 Overview

The Focus25 Design System provides a complete set of design tokens, components, and utilities to ensure consistency across the application. It's built with accessibility, performance, and developer experience in mind.

## 📦 Installation

The design system is already integrated into the Focus25 application. All components are available through the main export:

```typescript
import { Button, Card, Input, TimerDisplay } from '@/design-system';
```

## 🎯 Core Principles

### 1. **Consistency**

- Unified design tokens across all components
- Consistent spacing, typography, and color usage
- Standardized component APIs

### 2. **Accessibility**

- Built-in accessibility features
- Screen reader support
- High contrast support
- Keyboard navigation

### 3. **Performance**

- Optimized for React Native
- Minimal re-renders
- Efficient styling system

### 4. **Developer Experience**

- TypeScript support
- Comprehensive documentation
- Intuitive component APIs

## 🎨 Design Tokens

### Colors

The design system includes a comprehensive color palette with light and dark mode support:

```typescript
import { colorTokens } from '@/design-system';

// Light mode colors
colorTokens.light['bg-primary']; // #FFFFFF
colorTokens.light['text-primary']; // #1A202C
colorTokens.light['accent-focus']; // #5A67D8

// Dark mode colors
colorTokens.dark['bg-primary']; // #121212
colorTokens.dark['text-primary']; // #E0E0E0
colorTokens.dark['accent-focus']; // #7C90F7
```

### Typography

Consistent typography system with multiple font weights and sizes:

```typescript
import { typographyTokens } from '@/design-system';

typographyTokens.fontFamily.primary; // 'SF-Pro-Display-Regular'
typographyTokens.fontSize.base; // 16
typographyTokens.fontWeight.medium; // '500'
```

### Spacing

Consistent spacing scale based on 4px units:

```typescript
import { spacingTokens } from '@/design-system';

spacingTokens[1]; // 4px
spacingTokens[4]; // 16px
spacingTokens[8]; // 32px
```

## 🧩 Components

### Core Components

#### Button

Versatile button component with multiple variants and sizes:

```typescript
import { Button } from '@/design-system';

<Button
  variant="primary"
  size="md"
  onPress={handlePress}
  leftIcon="play"
>
  Start Timer
</Button>
```

#### Card

Flexible card component for content organization:

```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/design-system';

<Card variant="elevated" padding="lg">
  <CardHeader title="Focus Session" subtitle="25 minutes" />
  <CardContent>
    <Text>Session content here</Text>
  </CardContent>
  <CardFooter>
    <Button>Complete</Button>
  </CardFooter>
</Card>
```

#### Input

Form input component with validation support:

```typescript
import { Input } from '@/design-system';

<Input
  label="Session Duration"
  placeholder="Enter minutes"
  leftIcon="time"
  errorText="Please enter a valid duration"
  required
/>
```

### Layout Components

#### Container

Flexible container for layout management:

```typescript
import { Container } from '@/design-system';

<Container padding="lg" maxWidth="md" center>
  <Text>Centered content</Text>
</Container>
```

#### Stack

Flexible stack layout component:

```typescript
import { Stack } from '@/design-system';

<Stack direction="row" align="center" justify="space-between" gap="md">
  <Text>Left</Text>
  <Text>Right</Text>
</Stack>
```

#### Grid

Grid layout system:

```typescript
import { Grid, GridItem } from '@/design-system';

<Grid columns={3} gap="md">
  <GridItem span={1}>
    <Text>Item 1</Text>
  </GridItem>
  <GridItem span={2}>
    <Text>Item 2</Text>
  </GridItem>
</Grid>
```

### Specialized Components

#### Timer Components

```typescript
import { TimerDisplay, PlayPauseButton, PeriodButton } from '@/design-system';

<TimerDisplay
  minutes={25}
  seconds={0}
  progress={0.5}
  isRunning={true}
  size="lg"
/>

<PlayPauseButton
  isRunning={true}
  onPress={handleToggle}
  size="lg"
  variant="floating"
/>

<PeriodButton
  period="Focus"
  isSelected={true}
  onPress={handleSelect}
/>
```

#### Metrics Components

```typescript
import { MetricCard } from '@/design-system';

<MetricCard
  title="Focus Streak"
  value="7 days"
  icon="flame"
  trend="up"
  trendValue="+2 days"
  color="success"
/>
```

#### Settings Components

```typescript
import { SettingItem } from '@/design-system';

<SettingItem
  title="Notifications"
  subtitle="Get notified when sessions complete"
  icon="notifications"
  hasSwitch
  switchValue={true}
  onSwitchToggle={handleToggle}
/>
```

## 🎨 Theming

The design system supports both light and dark themes with automatic system detection:

```typescript
import { ThemeProvider, useTheme } from '@/design-system';

// Wrap your app with ThemeProvider
<ThemeProvider initialMode="auto">
  <App />
</ThemeProvider>

// Use theme in components
const MyComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors['bg-primary'] }}>
      <Text style={{ color: theme.colors['text-primary'] }}>
        Current theme: {isDark ? 'Dark' : 'Light'}
      </Text>
      <Button onPress={toggleTheme}>
        Toggle Theme
      </Button>
    </View>
  );
};
```

## 🛠 Utilities

### Style Utilities

```typescript
import { createStyleSheet, combineStyles } from '@/design-system';

const styles = createStyleSheet(
  theme => ({
    container: {
      backgroundColor: theme.colors['bg-primary'],
      padding: theme.spacing[4],
    },
  }),
  theme
);

const combinedStyle = combineStyles(style1, style2, style3);
```

### Color Utilities

```typescript
import { getColor, withOpacity } from '@/design-system';

const primaryColor = getColor('accent-focus', 'light');
const transparentColor = withOpacity(primaryColor, 0.5);
```

## 📱 Responsive Design

The design system includes responsive utilities for different screen sizes:

```typescript
import { getResponsiveValue, createResponsiveStyle } from '@/design-system';

const padding = getResponsiveValue(16, 24, 32); // phone, tablet, desktop
const style = createResponsiveStyle(
  { padding: 16 }, // phone
  { padding: 24 }, // tablet
  { padding: 32 } // desktop
);
```

## ♿ Accessibility

All components include built-in accessibility features:

- **Screen Reader Support**: Proper accessibility labels and roles
- **Keyboard Navigation**: Full keyboard support
- **High Contrast**: Support for high contrast mode
- **Focus Management**: Proper focus indicators

## 🚀 Performance

The design system is optimized for performance:

- **Minimal Re-renders**: Components use React.memo and optimized callbacks
- **Efficient Styling**: StyleSheet.create for optimal performance
- **Tree Shaking**: Modular exports for smaller bundle sizes

## 📚 Examples

### Complete Timer Screen

```typescript
import React from 'react';
import { View } from 'react-native';
import {
  Container,
  Stack,
  TimerDisplay,
  PlayPauseButton,
  PeriodButton,
  MetricCard,
} from '@/design-system';

const TimerScreen = () => {
  return (
    <Container padding="lg">
      <Stack direction="column" align="center" gap="xl">
        <TimerDisplay
          minutes={25}
          seconds={0}
          progress={0.5}
          isRunning={true}
          size="xl"
        />

        <PlayPauseButton
          isRunning={true}
          onPress={handleToggle}
          size="lg"
          variant="floating"
        />

        <Stack direction="row" gap="md">
          <PeriodButton
            period="Focus"
            isSelected={true}
            onPress={() => setPeriod('focus')}
          />
          <PeriodButton
            period="Short Break"
            isSelected={false}
            onPress={() => setPeriod('short-break')}
          />
          <PeriodButton
            period="Long Break"
            isSelected={false}
            onPress={() => setPeriod('long-break')}
          />
        </Stack>

        <Stack direction="row" gap="md">
          <MetricCard
            title="Today's Focus"
            value="2h 30m"
            icon="time"
            color="success"
          />
          <MetricCard
            title="Streak"
            value="7 days"
            icon="flame"
            trend="up"
            trendValue="+1 day"
          />
        </Stack>
      </Stack>
    </Container>
  );
};
```

## 🤝 Contributing

When adding new components to the design system:

1. **Follow the established patterns** for component structure
2. **Include comprehensive TypeScript types**
3. **Add accessibility features** (labels, roles, etc.)
4. **Use design tokens** for consistent styling
5. **Include examples** in the documentation
6. **Test on both light and dark themes**

## 📄 License

This design system is part of the Focus25 application and follows the same license terms.
