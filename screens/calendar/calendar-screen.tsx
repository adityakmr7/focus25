import TypographyText from '@/components/TypographyText';
import { useTodoStore } from '@/stores/local-todo-store';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { HStack, SPACING, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

const HOURS = Array.from({ length: 14 }, (_, i) => 6 + i); // 6:00 - 19:00

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  durationMinutes: number;
  category?: string;
};

const CalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const { todos } = useTodoStore();
  const [selectedDate] = useState<Date>(new Date());

  const categoryColors: Record<string, { dot: string; card: string }> = {
    Health: { dot: theme.colors['primary-400'], card: theme.colors['primary-50'] || '#EEF4FF' },
    Work: { dot: theme.colors['success-400'], card: theme.colors['success-50'] || '#EFFFF3' },
    Personal: {
      dot: theme.colors['warning-400'],
      card: theme.colors['warning-50'] || '#FFF6EA',
    },
  };

  const events: CalendarEvent[] = useMemo(() => {
    return (todos || [])
      .filter((t: any) => t?.reminderAt)
      .map((t: any) => {
        const start = new Date(t.reminderAt);
        const durationMinutes =
          Number(t.estimatedMinutes) && Number(t.estimatedMinutes) > 0
            ? Number(t.estimatedMinutes)
            : 60;
        return {
          id: t.id,
          title: t.title || 'Untitled',
          start,
          durationMinutes,
          category: t.category,
        } as CalendarEvent;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [todos]);

  const weekdayPills = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday start
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const dayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: SPACING['unit-18'] }}
      >
        <View style={styles.content}>
          {/* Header */}
          <HStack alignItems="baseline" gap="md" mb="md">
            <TypographyText variant="title" color="default" style={styles.headerTitle}>
              Calendar
            </TypographyText>
            <TypographyText variant="title" color="secondary" style={styles.headerDate}>
              {selectedDate.getDate()}{' '}
              {selectedDate.toLocaleString('en-US', { month: 'short' })}
            </TypographyText>
          </HStack>

          {/* Week pills */}
          <HStack gap="sm" mb="lg" style={{ flexWrap: 'nowrap' }}>
            {weekdayPills.map((d) => {
              const active = isSameDay(d, selectedDate);
              return (
                <VStack
                  key={d.toISOString()}
                  alignItems="center"
                  justifyContent="center"
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: active ? theme.colors.background : theme.colors.content2,
                      borderColor: active ? theme.colors.foreground : theme.colors.content3,
                    },
                  ]}
                >
                  <TypographyText
                    variant="caption"
                    color="default"
                    style={{ opacity: 0.7 }}
                  >
                    {d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}
                  </TypographyText>
                  <TypographyText variant="body" color="default" style={{ fontWeight: '700' }}>
                    {d.getDate()}
                  </TypographyText>
                </VStack>
              );
            })}
          </HStack>

          {/* Timeline */}
          <View style={styles.timeline}>
            {HOURS.map((h) => {
              const labelDate = new Date(selectedDate);
              labelDate.setHours(h, 0, 0, 0);
              const hourEvents = dayEvents.filter(
                (e) => e.start.getHours() === h,
              );
              return (
                <View key={h} style={styles.hourRow}>
                  <View style={styles.hourLabel}>
                    <TypographyText variant="caption" color="secondary">
                      {h}:00
                    </TypographyText>
                  </View>
                  <View style={styles.hourContent}>
                    {hourEvents.map((ev) => {
                      const minutes = ev.durationMinutes;
                      const height = Math.max(44, (minutes / 60) * 120); // visual scale
                      const colors = ev.category ? categoryColors[ev.category] : undefined;
                      return (
                        <View
                          key={ev.id}
                          style={[
                            styles.eventCard,
                            {
                              height,
                              backgroundColor: colors?.card || theme.colors.content2,
                              borderColor: theme.colors.content3,
                            },
                          ]}
                        >
                          <HStack alignItems="center" justifyContent="space-between">
                            <HStack alignItems="center" gap="sm">
                              <View
                                style={[
                                  styles.dot,
                                  { backgroundColor: colors?.dot || theme.colors.content4 },
                                ]}
                              />
                              <TypographyText variant="body" color="default" style={{ fontWeight: '700' }}>
                                {ev.title}
                              </TypographyText>
                            </HStack>
                            <TypographyText variant="caption" color="secondary">
                              {Math.round(minutes / 60) > 0
                                ? `${Math.round(minutes / 60)}h`
                                : `${minutes}m`}
                            </TypographyText>
                          </HStack>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerDate: {
    fontSize: 24,
    fontWeight: '700',
    opacity: 0.6,
  },
  dayPill: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeline: {
    marginTop: 8,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  hourLabel: {
    width: 48,
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  hourContent: {
    flex: 1,
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default CalendarScreen;


