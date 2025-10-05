/**
 * Design System Bottom Sheet Component
 * A reusable bottom sheet component using @gorhom/bottom-sheet
 */
// @ts-nocheck

import React, { useCallback, useMemo, useRef, forwardRef } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../themes';
import {
  createStyleSheet,
  combineViewStyles,
  combineTextStyles,
} from '../../utils';

export interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  index?: number;
  enablePanDownToClose?: boolean;
  enableOverDrag?: boolean;
  enableHandlePanningGesture?: boolean;
  handleIndicatorStyle?: ViewStyle;
  backgroundStyle?: ViewStyle;
  style?: ViewStyle;
  onClose?: () => void;
  onChange?: (index: number) => void;
}

export interface BottomSheetHeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export interface BottomSheetContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export interface BottomSheetFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const BottomSheetComponent = forwardRef<BottomSheet, BottomSheetProps>(
  (
    {
      children,
      snapPoints = ['25%', '50%', '90%'],
      index = -1,
      enablePanDownToClose = true,
      enableOverDrag = true,
      enableHandlePanningGesture = true,
      handleIndicatorStyle,
      backgroundStyle,
      style,
      onClose,
      onChange,
    },
    ref
  ) => {
    const { theme } = useTheme();
    const styles = createStyleSheet(bottomSheetStyles, theme);

    const snapPointsArray = useMemo(() => snapPoints, [snapPoints]);

    const handleSheetChanges = useCallback(
      (newIndex: number) => {
        if (newIndex === -1 && onClose) {
          onClose();
        }
        onChange?.(newIndex);
      },
      [onClose, onChange]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          onPress={onClose}
        />
      ),
      [onClose]
    );

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={snapPointsArray}
        onChange={handleSheetChanges}
        enablePanDownToClose={enablePanDownToClose}
        enableOverDrag={enableOverDrag}
        enableHandlePanningGesture={enableHandlePanningGesture}
        handleIndicatorStyle={[styles.handleIndicator, handleIndicatorStyle]}
        backgroundStyle={[styles.background, backgroundStyle]}
        style={[styles.container, style]}
        backdropComponent={renderBackdrop}
      >
        {children}
      </BottomSheet>
    );
  }
);

export const BottomSheetHeader: React.FC<BottomSheetHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showCloseButton = true,
  onClose,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(bottomSheetStyles, theme);

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={24}
              color={theme.colors['accent-focus']}
            />
          </View>
        )}
        <View style={styles.headerText}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.headerActions}>
        {rightIcon && onRightIconPress && (
          <Ionicons
            name={rightIcon}
            size={24}
            color={theme.colors['text-secondary']}
            onPress={onRightIconPress}
            style={styles.rightIcon}
          />
        )}
        {showCloseButton && onClose && (
          <Ionicons
            name='close'
            size={24}
            color={theme.colors['text-secondary']}
            onPress={onClose}
            style={styles.closeIcon}
          />
        )}
      </View>
    </View>
  );
};

export const BottomSheetContent: React.FC<BottomSheetContentProps> = ({
  children,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(bottomSheetStyles, theme);

  return (
    <BottomSheetView style={[styles.content, style]}>
      {children}
    </BottomSheetView>
  );
};

export const BottomSheetFooter: React.FC<BottomSheetFooterProps> = ({
  children,
  style,
}) => {
  const { theme } = useTheme();
  const styles = createStyleSheet(bottomSheetStyles, theme);

  return <View style={[styles.footer, style]}>{children}</View>;
};

const bottomSheetStyles = (theme: any) => ({
  container: {
    flex: 1,
  } as ViewStyle,
  background: {
    backgroundColor: theme.colors['bg-primary'],
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  } as ViewStyle,
  handleIndicator: {
    backgroundColor: theme.colors['border-primary'],
    width: 40,
    height: 4,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors['border-primary'],
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  leftIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors['accent-focus'] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semibold,
    color: theme.colors['text-primary'],
    marginBottom: theme.spacing[1],
  } as TextStyle,
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors['text-secondary'],
    lineHeight: 20,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  rightIcon: {
    padding: theme.spacing[2],
    marginRight: theme.spacing[1],
  } as ViewStyle,
  closeIcon: {
    padding: theme.spacing[2],
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  } as ViewStyle,
  footer: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors['border-primary'],
    backgroundColor: theme.colors['bg-secondary'],
  } as ViewStyle,
});
