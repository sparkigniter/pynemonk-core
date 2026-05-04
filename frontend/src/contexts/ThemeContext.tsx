import { createContext, useContext, useEffect, useState } from 'react';

export interface Theme {
    id: string;
    name: string;
    description: string;
    preview: string[]; // gradient stops for preview swatch
    variables: Record<string, string>;
}

export const THEMES: Theme[] = [
    {
        id: 'indigo',
        name: 'Indigo',
        description: 'Classic deep purple-blue for a focused, professional environment.',
        preview: ['#4f46e5', '#818cf8'],
        variables: {
            '--primary':         '#4f46e5',
            '--primary-dark':    '#4338ca',
            '--primary-darker':  '#3730a3',
            '--primary-light':   '#818cf8',
            '--primary-50':      '#f5f7ff',
            '--primary-100':     '#ebf0fe',
            '--sidebar-from':    '#11102b',
            '--sidebar-via':     '#1e1b4b',
            '--sidebar-to':      '#11102b',
            '--sidebar-active':  'rgba(255,255,255,0.12)',
            '--sidebar-dot':     '#818cf8',
            '--hero-from':       '#11102b',
            '--hero-via':        '#312e81',
            '--hero-to':         '#4f46e5',
            '--accent':          '#818cf8',
            '--ring':            'rgba(79,70,229,0.3)',
            '--page-bg-from':    '#f8fafc',
            '--page-bg-to':      '#f1f5f9',
        },
    },
    {
        id: 'emerald',
        name: 'Emerald',
        description: 'Fresh and revitalizing forest tones for an active workspace.',
        preview: ['#059669', '#34d399'],
        variables: {
            '--primary':         '#059669',
            '--primary-dark':    '#047857',
            '--primary-darker':  '#065f46',
            '--primary-light':   '#34d399',
            '--primary-50':      '#f0fdf4',
            '--primary-100':     '#dcfce7',
            '--sidebar-from':    '#022c22',
            '--sidebar-via':     '#064e3b',
            '--sidebar-to':      '#022c22',
            '--sidebar-active':  'rgba(255,255,255,0.12)',
            '--sidebar-dot':     '#34d399',
            '--hero-from':       '#022c22',
            '--hero-via':        '#065f46',
            '--hero-to':         '#10b981',
            '--accent':          '#34d399',
            '--ring':            'rgba(5,150,105,0.3)',
            '--page-bg-from':    '#f0fdf4',
            '--page-bg-to':      '#f0fdfa',
        },
    },
    {
        id: 'rose',
        name: 'Rose',
        description: 'Bold and energetic palette for creative engagement.',
        preview: ['#e11d48', '#fb7185'],
        variables: {
            '--primary':         '#e11d48',
            '--primary-dark':    '#be123c',
            '--primary-darker':  '#9f1239',
            '--primary-light':   '#fb7185',
            '--primary-50':      '#fff1f2',
            '--primary-100':     '#ffe4e6',
            '--sidebar-from':    '#1f0717',
            '--sidebar-via':     '#4c0519',
            '--sidebar-to':      '#1f0717',
            '--sidebar-active':  'rgba(255,255,255,0.12)',
            '--sidebar-dot':     '#fb7185',
            '--hero-from':       '#1f0717',
            '--hero-via':        '#881337',
            '--hero-to':         '#e11d48',
            '--accent':          '#fb7185',
            '--ring':            'rgba(225,29,72,0.3)',
            '--page-bg-from':    '#fff1f2',
            '--page-bg-to':      '#fff5f7',
        },
    },
    {
        id: 'amber',
        name: 'Amber',
        description: 'Warm, premium gold tones for an inviting academic feel.',
        preview: ['#d97706', '#fbbf24'],
        variables: {
            '--primary':         '#d97706',
            '--primary-dark':    '#b45309',
            '--primary-darker':  '#92400e',
            '--primary-light':   '#fbbf24',
            '--primary-50':      '#fffbeb',
            '--primary-100':     '#fef3c7',
            '--sidebar-from':    '#1a0f00',
            '--sidebar-via':     '#2d1b00',
            '--sidebar-to':      '#1a0f00',
            '--sidebar-active':  'rgba(255,255,255,0.1)',
            '--sidebar-dot':     '#fbbf24',
            '--hero-from':       '#1a0f00',
            '--hero-via':        '#78350f',
            '--hero-to':         '#d97706',
            '--accent':          '#fbbf24',
            '--ring':            'rgba(217,119,6,0.3)',
            '--page-bg-from':    '#fffbeb',
            '--page-bg-to':      '#fff7ed',
        },
    },
    {
        id: 'ocean',
        name: 'Ocean',
        description: 'Professional navy and sky blue for a calm, balanced UI.',
        preview: ['#0284c7', '#38bdf8'],
        variables: {
            '--primary':         '#0284c7',
            '--primary-dark':    '#0369a1',
            '--primary-darker':  '#075985',
            '--primary-light':   '#38bdf8',
            '--primary-50':      '#f0f9ff',
            '--primary-100':     '#e0f2fe',
            '--sidebar-from':    '#081a33',
            '--sidebar-via':     '#0c2447',
            '--sidebar-to':      '#081a33',
            '--sidebar-active':  'rgba(255,255,255,0.12)',
            '--sidebar-dot':     '#38bdf8',
            '--hero-from':       '#081a33',
            '--hero-via':        '#075985',
            '--hero-to':         '#0284c7',
            '--accent':          '#38bdf8',
            '--ring':            'rgba(2,132,199,0.3)',
            '--page-bg-from':    '#f0f9ff',
            '--page-bg-to':      '#f8fafc',
        },
    },
    {
        id: 'midnight',
        name: 'Midnight',
        description: 'Sophisticated obsidian and electric violet for modern elegance.',
        preview: ['#6d28d9', '#a78bfa'],
        variables: {
            '--primary':         '#6d28d9',
            '--primary-dark':    '#5b21b6',
            '--primary-darker':  '#4c1d95',
            '--primary-light':   '#a78bfa',
            '--primary-50':      '#f5f3ff',
            '--primary-100':     '#ede9fe',
            '--sidebar-from':    '#090914',
            '--sidebar-via':     '#13132b',
            '--sidebar-to':      '#090914',
            '--sidebar-active':  'rgba(255,255,255,0.12)',
            '--sidebar-dot':     '#a78bfa',
            '--hero-from':       '#090914',
            '--hero-via':        '#2e1065',
            '--hero-to':         '#6d28d9',
            '--accent':          '#a78bfa',
            '--ring':            'rgba(109,40,217,0.3)',
            '--page-bg-from':    '#f5f3ff',
            '--page-bg-to':      '#faf9ff',
        },
    },
];

interface ThemeContextType {
    theme: Theme;
    setTheme: (id: string) => void;
    themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
    theme: THEMES[0],
    setTheme: () => {},
    themes: THEMES,
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, val]) => {
        root.style.setProperty(key, val);
    });
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeId, setThemeId] = useState<string>(() => {
        return localStorage.getItem('eduerp-theme') ?? 'indigo';
    });

    const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = (id: string) => {
        localStorage.setItem('eduerp-theme', id);
        setThemeId(id);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};
