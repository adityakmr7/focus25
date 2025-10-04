# Focus25 Design System Components

## 📋 Component Overview

This document provides a quick reference for all available components in the Focus25 Design System.

## 🎨 Core Components

### Button
Versatile button component with multiple variants and sizes.

**Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`  
**Sizes:** `sm`, `md`, `lg`, `xl`  
**Features:** Loading states, icons, full width option

### Card
Flexible card component for content organization.

**Variants:** `default`, `elevated`, `outlined`, `filled`  
**Padding:** `none`, `sm`, `md`, `lg`, `xl`  
**Sub-components:** `CardHeader`, `CardContent`, `CardFooter`

### Input
Form input component with validation support.

**Variants:** `default`, `outlined`, `filled`, `underlined`  
**Sizes:** `sm`, `md`, `lg`  
**Features:** Labels, helper text, error states, icons

## 🏗️ Layout Components

### Container
Flexible container for layout management.

**Padding:** `none`, `sm`, `md`, `lg`, `xl`  
**Margin:** `none`, `sm`, `md`, `lg`, `xl`  
**Max Width:** `sm`, `md`, `lg`, `xl`, `full`

### Stack
Flexible stack layout component.

**Direction:** `row`, `column`, `row-reverse`, `column-reverse`  
**Align:** `start`, `center`, `end`, `stretch`  
**Justify:** `start`, `center`, `end`, `space-between`, `space-around`, `space-evenly`  
**Gap:** `none`, `xs`, `sm`, `md`, `lg`, `xl`

### Grid
Grid layout system.

**Columns:** `1`, `2`, `3`, `4`, `6`, `12`  
**Gap:** `none`, `sm`, `md`, `lg`, `xl`  
**Sub-component:** `GridItem` with span support

### Spacer
Utility component for consistent spacing.

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`  
**Direction:** `horizontal`, `vertical`

## ⏱️ Timer Components

### TimerDisplay
Specialized timer display component.

**Sizes:** `sm`, `md`, `lg`, `xl`  
**Variants:** `default`, `minimal`, `detailed`  
**Features:** Progress bar, break/focus states, animations

### PlayPauseButton
Play/pause button for timer control.

**Sizes:** `sm`, `md`, `lg`, `xl`  
**Variants:** `default`, `minimal`, `floating`  
**States:** Running, paused, disabled

### PeriodButton
Button for selecting timer periods.

**Variants:** `default`, `minimal`, `pill`  
**Sizes:** `sm`, `md`, `lg`  
**States:** Selected, disabled

## 📊 Metrics Components

### MetricCard
Card component for displaying metrics and statistics.

**Sizes:** `sm`, `md`, `lg`  
**Variants:** `default`, `minimal`, `highlighted`  
**Colors:** `primary`, `success`, `warning`, `error`, `info`  
**Features:** Icons, trends, trend values

## ⚙️ Settings Components

### SettingItem
Specialized component for settings screen items.

**Variants:** `default`, `destructive`, `warning`  
**Features:** Icons, switches, arrows, values, subtitles

## 🎨 Design Tokens

### Colors
- **Light Mode:** Complete color palette with semantic naming
- **Dark Mode:** Dark theme colors with proper contrast
- **Accent Colors:** Focus, break, success, warning, error, info

### Typography
- **Font Families:** SF Pro Display variants (Regular, Medium, Semibold, Bold, etc.)
- **Font Sizes:** xs to 9xl scale
- **Font Weights:** Thin to Black
- **Line Heights:** None to Loose
- **Letter Spacing:** Tighter to Widest

### Spacing
- **Base Unit:** 4px
- **Scale:** 0 to 96 (0px to 384px)
- **Consistent:** Used across all components

### Shadows
- **Levels:** none, sm, base, md, lg, xl, 2xl
- **Platform:** iOS and Android optimized
- **Elevation:** Proper depth hierarchy

### Border Radius
- **Scale:** none to full
- **Consistent:** Applied to all rounded components

## 🎯 Usage Examples

### Basic Button
```typescript
<Button variant="primary" size="md" onPress={handlePress}>
  Click Me
</Button>
```

### Card with Content
```typescript
<Card variant="elevated" padding="lg">
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardContent>
    <Text>Content here</Text>
  </CardContent>
</Card>
```

### Timer Display
```typescript
<TimerDisplay
  minutes={25}
  seconds={0}
  progress={0.5}
  isRunning={true}
  size="lg"
/>
```

### Settings Item
```typescript
<SettingItem
  title="Notifications"
  subtitle="Get notified when sessions complete"
  icon="notifications"
  hasSwitch
  switchValue={true}
  onSwitchToggle={handleToggle}
/>
```

## 🚀 Getting Started

1. Import components from the design system:
```typescript
import { Button, Card, Input } from '@/design-system';
```

2. Use the theme provider:
```typescript
import { ThemeProvider } from '@/design-system';

<ThemeProvider>
  <App />
</ThemeProvider>
```

3. Access theme in components:
```typescript
import { useTheme } from '@/design-system';

const { theme, isDark, toggleTheme } = useTheme();
```

## 📚 Documentation

- **README.md**: Complete design system overview
- **COMPONENTS.md**: This component reference
- **Examples**: TimerScreenExample, SettingsScreenExample
- **TypeScript**: Full type definitions for all components

## 🤝 Contributing

When adding new components:
1. Follow established patterns
2. Include TypeScript types
3. Add accessibility features
4. Use design tokens
5. Include examples
6. Test both themes
