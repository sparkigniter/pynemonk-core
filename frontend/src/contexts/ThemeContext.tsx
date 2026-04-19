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
        description: 'Classic deep purple-blue',
        preview: ['#6366f1', '#8b5cf6'],
        variables: {
            '--primary':         '#6366f1',
            '--primary-dark':    '#4f46e5',
            '--primary-darker':  '#3730a3',
            '--primary-light':   '#a5b4fc',
            '--primary-50':      '#eef2ff',
            '--primary-100':     '#e0e7ff',
            '--sidebar-from':    '#1e1b4b',
            '--sidebar-via':     '#2d2a6e',
            '--sidebar-to':      '#1e1b4b',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#818cf8',
            '--hero-from':       '#1e1b4b',
            '--hero-via':        '#3730a3',
            '--hero-to':         '#7c3aed',
            '--accent':          '#8b5cf6',
            '--ring':            'rgba(99,102,241,0.4)',
            '--page-bg-from':    '#f0f4ff',
            '--page-bg-to':      '#f5f3ff',
        },
    },
    {
        id: 'emerald',
        name: 'Emerald',
        description: 'Fresh and nature-inspired',
        preview: ['#10b981', '#059669'],
        variables: {
            '--primary':         '#10b981',
            '--primary-dark':    '#059669',
            '--primary-darker':  '#047857',
            '--primary-light':   '#6ee7b7',
            '--primary-50':      '#ecfdf5',
            '--primary-100':     '#d1fae5',
            '--sidebar-from':    '#052e16',
            '--sidebar-via':     '#064e3b',
            '--sidebar-to':      '#052e16',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#34d399',
            '--hero-from':       '#052e16',
            '--hero-via':        '#065f46',
            '--hero-to':         '#0d9488',
            '--accent':          '#34d399',
            '--ring':            'rgba(16,185,129,0.4)',
            '--page-bg-from':    '#f0fdf4',
            '--page-bg-to':      '#f0fdfa',
        },
    },
    {
        id: 'rose',
        name: 'Rose',
        description: 'Bold and vibrant energy',
        preview: ['#f43f5e', '#e11d48'],
        variables: {
            '--primary':         '#f43f5e',
            '--primary-dark':    '#e11d48',
            '--primary-darker':  '#be123c',
            '--primary-light':   '#fda4af',
            '--primary-50':      '#fff1f2',
            '--primary-100':     '#ffe4e6',
            '--sidebar-from':    '#1f0717',
            '--sidebar-via':     '#4c0519',
            '--sidebar-to':      '#1f0717',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#fb7185',
            '--hero-from':       '#1f0717',
            '--hero-via':        '#881337',
            '--hero-to':         '#e11d48',
            '--accent':          '#fb7185',
            '--ring':            'rgba(244,63,94,0.4)',
            '--page-bg-from':    '#fff1f2',
            '--page-bg-to':      '#fdf2f8',
        },
    },
    {
        id: 'amber',
        name: 'Amber',
        description: 'Warm and inviting sunshine',
        preview: ['#f59e0b', '#d97706'],
        variables: {
            '--primary':         '#f59e0b',
            '--primary-dark':    '#d97706',
            '--primary-darker':  '#b45309',
            '--primary-light':   '#fcd34d',
            '--primary-50':      '#fffbeb',
            '--primary-100':     '#fef3c7',
            '--sidebar-from':    '#1c0a00',
            '--sidebar-via':     '#3b1200',
            '--sidebar-to':      '#1c0a00',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#fbbf24',
            '--hero-from':       '#1c0a00',
            '--hero-via':        '#78350f',
            '--hero-to':         '#d97706',
            '--accent':          '#fbbf24',
            '--ring':            'rgba(245,158,11,0.4)',
            '--page-bg-from':    '#fffbeb',
            '--page-bg-to':      '#fff7ed',
        },
    },
    {
        id: 'ocean',
        name: 'Ocean',
        description: 'Deep and calming teal-blue',
        preview: ['#0ea5e9', '#0284c7'],
        variables: {
            '--primary':         '#0ea5e9',
            '--primary-dark':    '#0284c7',
            '--primary-darker':  '#0369a1',
            '--primary-light':   '#7dd3fc',
            '--primary-50':      '#f0f9ff',
            '--primary-100':     '#e0f2fe',
            '--sidebar-from':    '#0c1a2e',
            '--sidebar-via':     '#0f3460',
            '--sidebar-to':      '#0c1a2e',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#38bdf8',
            '--hero-from':       '#0c1a2e',
            '--hero-via':        '#0c4a6e',
            '--hero-to':         '#0284c7',
            '--accent':          '#38bdf8',
            '--ring':            'rgba(14,165,233,0.4)',
            '--page-bg-from':    '#f0f9ff',
            '--page-bg-to':      '#f0fdfa',
        },
    },
    {
        id: 'midnight',
        name: 'Midnight',
        description: 'Sleek dark violet elegance',
        preview: ['#7c3aed', '#4c1d95'],
        variables: {
            '--primary':         '#7c3aed',
            '--primary-dark':    '#6d28d9',
            '--primary-darker':  '#5b21b6',
            '--primary-light':   '#c4b5fd',
            '--primary-50':      '#f5f3ff',
            '--primary-100':     '#ede9fe',
            '--sidebar-from':    '#0d0d1a',
            '--sidebar-via':     '#1e0035',
            '--sidebar-to':      '#0d0d1a',
            '--sidebar-active':  'rgba(255,255,255,0.13)',
            '--sidebar-dot':     '#a78bfa',
            '--hero-from':       '#0d0d1a',
            '--hero-via':        '#2e1065',
            '--hero-to':         '#6d28d9',
            '--accent':          '#a78bfa',
            '--ring':            'rgba(124,58,237,0.4)',
            '--page-bg-from':    '#f5f3ff',
            '--page-bg-to':      '#fdf4ff',
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
