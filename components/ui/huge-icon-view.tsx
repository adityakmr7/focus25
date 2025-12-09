import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircleIcon } from '@hugeicons/core-free-icons';
import React from 'react';

type IconType = typeof CheckmarkCircleIcon;

interface HugeIconViewProps {
    icon: IconType;
    size?: number;
    color?: string;
}

const HugeIconView: React.FC<HugeIconViewProps> = ({ icon, size = 24, color = 'black' }) => {
    return <HugeiconsIcon icon={icon} size={size} color={color} />;
};

export default HugeIconView;
