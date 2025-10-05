/**
 * Design System Timer Screen Example
 * Demonstrates how to use the design system components in a complete timer screen
 */
// @ts-nocheck

import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  Container,
  Stack,
  Spacer,
  TimerDisplay,
  PlayPauseButton,
  PeriodButton,
  MetricCard,
  Card,
  CardHeader,
  CardContent,
  Button,
} from '../index';

export const TimerScreenExample: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<
    'focus' | 'short-break' | 'long-break'
  >('focus');
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePeriodChange = (
    period: 'focus' | 'short-break' | 'long-break'
  ) => {
    setCurrentPeriod(period);
    setIsRunning(false);
    setIsPaused(false);

    switch (period) {
      case 'focus':
        setMinutes(25);
        setSeconds(0);
        break;
      case 'short-break':
        setMinutes(5);
        setSeconds(0);
        break;
      case 'long-break':
        setMinutes(15);
        setSeconds(0);
        break;
    }
    setProgress(0);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <Container padding='lg'>
        <Stack direction='column' align='center' gap='xl'>
          {/* Timer Display */}
          <TimerDisplay
            minutes={minutes}
            seconds={seconds}
            progress={progress}
            isRunning={isRunning}
            isBreak={currentPeriod !== 'focus'}
            size='xl'
            variant='detailed'
          />

          {/* Play/Pause Button */}
          <PlayPauseButton
            isRunning={isRunning}
            isPaused={isPaused}
            onPress={handleToggleTimer}
            size='lg'
            variant='floating'
          />

          {/* Period Selection */}
          <Stack direction='row' gap='sm' wrap>
            <PeriodButton
              period='Focus'
              isSelected={currentPeriod === 'focus'}
              onPress={() => handlePeriodChange('focus')}
              variant='pill'
            />
            <PeriodButton
              period='Short Break'
              isSelected={currentPeriod === 'short-break'}
              onPress={() => handlePeriodChange('short-break')}
              variant='pill'
            />
            <PeriodButton
              period='Long Break'
              isSelected={currentPeriod === 'long-break'}
              onPress={() => handlePeriodChange('long-break')}
              variant='pill'
            />
          </Stack>

          {/* Metrics Cards */}
          <Stack direction='row' gap='md' wrap>
            <MetricCard
              title="Today's Focus"
              value='2h 30m'
              icon='time'
              color='success'
              size='md'
            />
            <MetricCard
              title='Current Streak'
              value='7 days'
              icon='flame'
              trend='up'
              trendValue='+1 day'
              color='primary'
              size='md'
            />
          </Stack>

          {/* Session Stats */}
          <Card variant='elevated' padding='lg' style={{ width: '100%' }}>
            <CardHeader
              title='Session Statistics'
              subtitle='Your focus performance today'
              icon='analytics'
            />
            <CardContent>
              <Stack direction='column' gap='md'>
                <Stack direction='row' justify='space-between'>
                  <Text>Sessions Completed</Text>
                  <Text>8</Text>
                </Stack>
                <Stack direction='row' justify='space-between'>
                  <Text>Average Focus Time</Text>
                  <Text>23m</Text>
                </Stack>
                <Stack direction='row' justify='space-between'>
                  <Text>Distractions</Text>
                  <Text>2</Text>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Stack direction='row' gap='md' wrap>
            <Button
              variant='outline'
              size='md'
              leftIcon='refresh'
              onPress={() => {
                setIsRunning(false);
                setIsPaused(false);
                setProgress(0);
              }}
            >
              Reset
            </Button>
            <Button
              variant='secondary'
              size='md'
              leftIcon='settings'
              onPress={() => console.log('Settings')}
            >
              Settings
            </Button>
          </Stack>
        </Stack>
      </Container>
    </ScrollView>
  );
};
