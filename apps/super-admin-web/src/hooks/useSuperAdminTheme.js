import { useState } from 'react';

const THEME_STORAGE_KEY = 'superAdminTheme';

export const useSuperAdminTheme = () => {
    const [theme, setTheme] = useState(() =>
        localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
    );

    const toggleTheme = () => {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            return nextTheme;
        });
    };

    return { theme, toggleTheme };
};
