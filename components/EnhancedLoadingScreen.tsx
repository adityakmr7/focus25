import TypographyText from '@/components/TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EnhancedLoadingScreenProps {
    message?: string;
    showProgress?: boolean;
}

const INSPIRATIONAL_QUOTES = [
    {
        quote: "Focus is not about saying yes to everything. It's about saying no to all but the essential.",
        author: 'Steve Jobs',
    },
    {
        quote: 'The secret of getting ahead is getting started.',
        author: 'Mark Twain',
    },
    {
        quote: 'Do one thing at a time. Do it well.',
        author: 'Unknown',
    },
    {
        quote: 'Productivity is never an accident. It is always the result of a commitment to excellence.',
        author: 'Paul J. Meyer',
    },
    {
        quote: 'Concentrate all your thoughts upon the work at hand.',
        author: 'Alexander Graham Bell',
    },
    {
        quote: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
    },
    {
        quote: 'Focus on being productive instead of busy.',
        author: 'Tim Ferriss',
    },
    {
        quote: "You don't have to be great to start, but you have to start to be great.",
        author: 'Zig Ziglar',
    },
];

const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = () => {
    const colors = useColorTheme();
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(1));

    // Rotate quotes every 3 seconds
    useEffect(() => {
        const quoteInterval = setInterval(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            setCurrentQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
        }, 3000);

        return () => clearInterval(quoteInterval);
    }, [fadeAnim]);

    const currentQuote = INSPIRATIONAL_QUOTES[currentQuoteIndex];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.content}>
                {/* Quote Section */}
                <View style={styles.quoteSection}>
                    <Animated.View style={[styles.quoteContainer, { opacity: fadeAnim }]}>
                        <TypographyText
                            variant="body"
                            style={[styles.quote, { color: colors.contentPrimary }]}
                        >
                            {`"${currentQuote.quote}"`}
                        </TypographyText>
                        <TypographyText
                            variant="caption"
                            style={[styles.author, { color: colors.contentPrimary }]}
                        >
                            — {currentQuote.author}
                        </TypographyText>
                    </Animated.View>
                </View>

                {/* Spinner */}
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="small" color={colors.contentPrimary} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    quoteSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quoteContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    quote: {
        fontSize: 20,
        lineHeight: 30,
        textAlign: 'center',
        color: '#000000',
        fontWeight: '400',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    author: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.6,
        fontStyle: 'italic',
    },
    spinnerContainer: {
        paddingBottom: 60,
        alignItems: 'center',
    },
});

export default EnhancedLoadingScreen;
