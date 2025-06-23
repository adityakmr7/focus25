export interface MusicTrack {
    id: string;
    name: string;
    duration: string;
    type: 'nature' | 'focus' | 'ambient' | 'binaural';
    description: string;
    source: string;
    color: string;
    isLocal: boolean;
}
export const audioSource = require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3');
export const musicTracks: MusicTrack[] = [
    {
        id: 'forest-rain',
        name: 'Forest Rain',
        duration: '45:00',
        type: 'nature',
        description: 'Gentle rainfall in a peaceful forest',
        source: 'https://zcscxzzuwwkjfdtjgozi.supabase.co/storage/v1/object/public/songs//rain-instrument.mp3',
        color: '#10B981',
        isLocal: true,
    },
    {
        id: 'ocean-waves',
        name: 'Ocean Waves',
        duration: '60:00',
        type: 'nature',
        description: 'Calming ocean sounds for deep focus',
        source: 'https://zcscxzzuwwkjfdtjgozi.supabase.co/storage/v1/object/public/songs//ocean-instrumental.mp3',
        color: '#3B82F6',
        isLocal: true,
    },
    {
        id: 'binaural-alpha',
        name: 'Alpha Waves',
        duration: '30:00',
        type: 'binaural',
        description: 'Alpha waves for enhanced concentration',
        source: 'https://zcscxzzuwwkjfdtjgozi.supabase.co/storage/v1/object/public/songs//alpha-waves-instrument.mp3',
        color: '#8B5CF6',
        isLocal: true,
    },
];
