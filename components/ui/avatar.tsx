import React from 'react';
import {
    Image,
    ImageProps,
    ImageSourcePropType,
    StyleProp,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import TypographyText from '../TypographyText';
import { useColorTheme } from '@/hooks/useColorTheme';

interface AvatarProps {
    source?: ImageSourcePropType | { uri: string } | null;
    label?: string;
    size?: number;
    rounded?: boolean;
    backgroundColor?: string;
    textColor?: string;
    style?: StyleProp<ViewStyle>;
    imageProps?: Partial<ImageProps>;
}

const Avatar: React.FC<AvatarProps> = ({
    source,
    label,
    size = 40,
    rounded = true,
    backgroundColor,
    textColor,
    style,
    imageProps,
}) => {
    const colors = useColorTheme();
    const borderRadius = rounded ? size / 2 : 8;
    const bg = backgroundColor ?? colors.backgroundPrimary;
    const fg = textColor ?? colors.contentPrimary;

    const hasSource =
        !!source &&
        !(
            // If source is an object with uri, ensure it's non-empty
            (typeof source === 'object' && 'uri' in (source as any) && !(source as any).uri)
        );

    const initial =
        !hasSource && label && label.trim().length > 0
            ? label.trim().charAt(0).toUpperCase()
            : null;

    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hasSource ? 'transparent' : bg,
                },
                style,
            ]}
            accessibilityLabel={label ? `Avatar for ${label}` : 'Avatar'}
            accessible
        >
            {hasSource ? (
                <Image
                    source={source as ImageSourcePropType}
                    style={{ width: size, height: size, borderRadius }}
                    resizeMode="cover"
                    {...imageProps}
                />
            ) : initial ? (
                <TypographyText
                    variant="body"
                    style={
                        {
                            color: fg,
                            fontSize: size * 0.45,
                            fontWeight: '700',
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                        } as Text['props']['style']
                    }
                >
                    {initial}
                </TypographyText>
            ) : (
                <View
                    style={{
                        width: size * 0.4,
                        height: size * 0.4,
                        borderRadius: (size * 0.4) / 2,
                        backgroundColor: fg,
                        opacity: 0.2,
                    }}
                />
            )}
        </View>
    );
};

export default Avatar;
