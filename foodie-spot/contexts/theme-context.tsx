import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { storage } from '@/services/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: 'light' | 'dark';
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'user_theme_mode';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useSystemColorScheme() ?? 'light';
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        storage.getItem<ThemeMode>(THEME_KEY).then(saved => {
            if (saved) setThemeModeState(saved);
        });
    }, []);

    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await storage.setItem(THEME_KEY, mode);
    }, []);

    const theme = themeMode === 'system' ? systemScheme : themeMode;

    return (
        <ThemeContext.Provider value={{
            theme,
            themeMode,
            setThemeMode,
            isDark: theme === 'dark',
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};