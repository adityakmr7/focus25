import React from 'react';
import { View, ViewProps } from 'react-native';
import { SPACING } from '@/constants/spacing';

interface VStackProps extends Omit<ViewProps, 'style'> {
    gap?: keyof typeof SPACING | number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    flex?: number;
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

const GAP_MAP: Record<string, number> = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
};

function getSpacingValue(value: keyof typeof SPACING | number | string | undefined): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (value in SPACING) return SPACING[value as keyof typeof SPACING];
    if (value in GAP_MAP) return GAP_MAP[value];
    return undefined;
}

export const VStack: React.FC<VStackProps> = ({
    gap,
    alignItems,
    justifyContent,
    flex,
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
    const gapValue = getSpacingValue(gap);
    
    const computedStyle = [
        {
            flexDirection: 'column' as const,
            ...(gapValue !== undefined && { gap: gapValue }),
            ...(alignItems && { alignItems }),
            ...(justifyContent && { justifyContent }),
            ...(flex !== undefined && { flex }),
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

export default VStack;

