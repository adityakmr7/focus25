import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, Platform } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';

interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
    value: boolean;
    onChange: (value: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
    sm: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    md: {
        transform: [{ scaleX: 1 }, { scaleY: 1 }],
    },
    lg: {
        transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
    },
};

export const Switch: React.FC<SwitchProps> = ({
    value,
    onChange,
    size = 'md',
    ...props
}) => {
    const colors = useColorTheme();

    // iOS uses tintColor for the on state and backgroundColor for the track
    // Android uses thumbColor and trackColor
    const switchProps: RNSwitchProps = {
        value,
        onValueChange: onChange,
        ...(Platform.OS === 'ios' && {
            trackColor: {
                false: colors.surfacePrimary,
                true: colors.secondary,
            },
            thumbColor: colors.backgroundPrimary,
        }),
        ...(Platform.OS === 'android' && {
            thumbColor: value ? colors.backgroundPrimary : colors.contentSecondary,
            trackColor: {
                false: colors.surfacePrimary,
                true: colors.secondary,
            },
        }),
        ...props,
    };

    return (
        <RNSwitch
            {...switchProps}
            style={[SIZE_MAP[size], props.style]}
        />
    );
};

export default Switch;

