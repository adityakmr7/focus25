import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, ViewStyle } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
    onPress: () => void;
    disabled?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'bordered' | 'light' | 'outline';
    style?: ViewStyle;
    children: React.ReactNode;
}

const SIZE_STYLES = {
    sm: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 32,
    },
    md: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 40,
    },
    lg: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        minHeight: 48,
    },
};

export const Button: React.FC<ButtonProps> = ({
    onPress,
    disabled,
    isDisabled,
    isLoading,
    size = 'md',
    variant = 'solid',
    style,
    children,
    ...props
}) => {
    const colors = useColorTheme();
    const isDisabledState = disabled || isDisabled || isLoading;

    // Variant styles
    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'solid':
                return {
                    backgroundColor: colors.contentPrimary,
                    borderWidth: 0,
                };
            case 'bordered':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.contentPrimary,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.surfacePrimary,
                };
            case 'light':
                return {
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 0,
                };
            default:
                return {
                    backgroundColor: colors.contentPrimary,
                    borderWidth: 0,
                };
        }
    };

    const buttonStyle: ViewStyle = {
        ...SIZE_STYLES[size],
        ...getVariantStyle(),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabledState ? 0.6 : 1,
        ...style,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabledState}
            activeOpacity={0.7}
            style={buttonStyle}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={
                        variant === 'solid'
                            ? colors.backgroundPrimary
                            : variant === 'bordered' || variant === 'outline'
                              ? colors.contentPrimary
                              : colors.contentPrimary
                    }
                />
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};

export default Button;

