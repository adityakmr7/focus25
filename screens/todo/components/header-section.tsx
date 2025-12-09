import TypographyText from '@/components/TypographyText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HeaderSectionProps {
    greeting: string;
    subtitle: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ greeting, subtitle }) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TypographyText variant="heading" color="default" style={styles.greeting}>
                    {greeting}
                </TypographyText>
                <TypographyText variant="body" color="secondary" style={styles.subtitle}>
                    {subtitle}
                </TypographyText>
            </View>
            {/* <View style={styles.avatarContainer}>
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.content2 }]}
        >
          <Ionicons name="person" size={24} color={theme.colors.foreground} />
        </View>
      </View> */}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
    },
    avatarContainer: {
        marginLeft: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HeaderSection;
