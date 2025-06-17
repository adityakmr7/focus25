import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

// Memoized components for better performance
export const MemoizedText = memo<{ children: React.ReactNode; style?: any }>(
  ({ children, style }) => <Text style={style}>{children}</Text>
);

export const MemoizedView = memo<{ children: React.ReactNode; style?: any }>(
  ({ children, style }) => <View style={style}>{children}</View>
);

// Optimized FlatList component
interface OptimizedFlatListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  style?: any;
  contentContainerStyle?: any;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 80,
  windowSize = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  style,
  contentContainerStyle,
}: OptimizedFlatListProps<T>) {
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews}
      initialNumToRender={10}
      style={style}
      contentContainerStyle={contentContainerStyle}
    />
  );
}

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useMemo(() => Date.now(), []);
  
  React.useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime;
    
    if (__DEV__ && renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`${componentName} render took ${renderTime}ms (>16ms)`);
    }
  });

  return {
    logPerformance: useCallback((operation: string, duration: number) => {
      if (__DEV__ && duration > 100) {
        console.warn(`${componentName} ${operation} took ${duration}ms`);
      }
    }, [componentName]),
  };
};

// Debounced input hook for performance
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottledCallback = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const lastRun = React.useRef(Date.now());

  return useCallback(
    (...args: T) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
};

// Optimized image component with lazy loading
interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = memo<OptimizedImageProps>(({
  source,
  style,
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  if (hasError) {
    return placeholder || <View style={[style, { backgroundColor: '#f0f0f0' }]} />;
  }

  return (
    <View style={style}>
      {!isLoaded && placeholder}
      <Image
        source={source}
        style={[style, !isLoaded && { opacity: 0 }]}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
});

// Memory usage monitor (development only)
export const MemoryMonitor: React.FC = memo(() => {
  const [memoryUsage, setMemoryUsage] = React.useState<number>(0);
  const { theme } = useTheme();

  React.useEffect(() => {
    if (!__DEV__) return;

    const interval = setInterval(() => {
      // This would need a native module to get actual memory usage
      // For now, we'll simulate it
      const usage = Math.random() * 100;
      setMemoryUsage(usage);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!__DEV__) return null;

  return (
    <View style={[styles.memoryMonitor, { backgroundColor: theme.surface }]}>
      <Text style={[styles.memoryText, { color: theme.text }]}>
        Memory: {memoryUsage.toFixed(1)}MB
      </Text>
    </View>
  );
});

// Performance-optimized timer display
interface OptimizedTimerDisplayProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
}

export const OptimizedTimerDisplay = memo<OptimizedTimerDisplayProps>(
  ({ minutes, seconds, isRunning }) => {
    const { theme } = useTheme();
    
    const formattedTime = useMemo(() => {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [minutes, seconds]);

    const timerStyle = useMemo(() => [
      styles.timerText,
      { color: theme.text },
      isRunning && styles.runningTimer,
    ], [theme.text, isRunning]);

    return (
      <MemoizedText style={timerStyle}>
        {formattedTime}
      </MemoizedText>
    );
  }
);

// Batch state updates hook
export const useBatchedUpdates = <T>(initialState: T) => {
  const [state, setState] = React.useState<T>(initialState);
  const pendingUpdates = React.useRef<Partial<T>[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        const newState = { ...prevState };
        pendingUpdates.current.forEach(update => {
          Object.assign(newState, update);
        });
        pendingUpdates.current = [];
        return newState;
      });
    }, 16); // Batch updates for one frame
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
};

const styles = StyleSheet.create({
  memoryMonitor: {
    position: 'absolute',
    top: 50,
    right: 10,
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  memoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '300',
    fontFamily: 'monospace',
  },
  runningTimer: {
    color: '#10B981',
  },
});