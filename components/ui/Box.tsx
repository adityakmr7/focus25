import React from 'react';
import { View, ViewProps } from 'react-native';
import { SPACING } from '@/constants/spacing';

interface BoxProps extends Omit<ViewProps, 'style'> {
    borderRadius?: number | 'full' | 'sm' | 'md' | 'lg';
    // Padding props
    p?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    px?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    py?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    pt?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    pb?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    pl?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    pr?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    // Margin props
    m?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    mx?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    my?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    mt?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    mb?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    ml?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    mr?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    style?: ViewProps['style'];
}

const SPACING_MAP: Record<string, number> = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};

const BORDER_RADIUS_MAP: Record<string, number> = {
    sm: 4,
    md: 8,
    lg: 12,
    full: 999,
};

function getSpacingValue(value: keyof typeof SPACING | number | string | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (value in SPACING) return SPACING[value as keyof typeof SPACING];
    if (value in SPACING_MAP) return SPACING_MAP[value];
    return undefined;
}

function getBorderRadius(value: number | string | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (value in BORDER_RADIUS_MAP) return BORDER_RADIUS_MAP[value];
    return undefined;
}

export const Box: React.FC<BoxProps> = ({
    borderRadius,
    p,
    px,
    py,
    pt,
    pb,
    pl,
    pr,
    m,
    mx,
    my,
    mt,
    mb,
    ml,
    mr,
    style,
    children,
    ...props
}) => {
    const computedStyle = [
        {
            ...(borderRadius !== undefined && { borderRadius: getBorderRadius(borderRadius) }),
            ...(p !== undefined && { padding: getSpacingValue(p) }),
            ...(px !== undefined && { paddingHorizontal: getSpacingValue(px) }),
            ...(py !== undefined && { paddingVertical: getSpacingValue(py) }),
            ...(pt !== undefined && { paddingTop: getSpacingValue(pt) }),
            ...(pb !== undefined && { paddingBottom: getSpacingValue(pb) }),
            ...(pl !== undefined && { paddingLeft: getSpacingValue(pl) }),
            ...(pr !== undefined && { paddingRight: getSpacingValue(pr) }),
            ...(m !== undefined && { margin: getSpacingValue(m) }),
            ...(mx !== undefined && { marginHorizontal: getSpacingValue(mx) }),
            ...(my !== undefined && { marginVertical: getSpacingValue(my) }),
            ...(mt !== undefined && { marginTop: getSpacingValue(mt) }),
            ...(mb !== undefined && { marginBottom: getSpacingValue(mb) }),
            ...(ml !== undefined && { marginLeft: getSpacingValue(ml) }),
            ...(mr !== undefined && { marginRight: getSpacingValue(mr) }),
        },
        style,
    ];

    return (
        <View style={computedStyle} {...props}>
            {children}
        </View>
    );
};

export default Box;

