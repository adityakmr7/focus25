import React from 'react';
import { View, StyleSheet } from 'react-native';
import cn from '../lib/cn';

interface SessionDotsProps {
  currentSession: number;
  totalSessions: number;
}

/**
 * A component that displays session progress dots
 * @param currentSession - The current session number (1-based)
 * @param totalSessions - The total number of sessions
 */
export const SessionDots: React.FC<SessionDotsProps> = ({
  currentSession,
  totalSessions,
}) => (
  <View style={styles.sessionDots}>
    {Array.from({ length: totalSessions }, (_, index) => (
      <View
        key={index}
        className={cn(
          'w-6 h-6 rounded-full',
          index < currentSession
            ? 'bg-break-short dark:bg-break-short'
            : 'bg-dark-bg-200'
        )}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  sessionDots: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
});
