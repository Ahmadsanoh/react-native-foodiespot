import { useTheme } from '@/contexts/theme-context';
import { lightColors, darkColors, palette, AppColors } from '@/constants/theme';

export function useAppTheme(): { colors: AppColors; isDark: boolean; palette: typeof palette } {
    const { isDark } = useTheme();
    return {
        colors: isDark ? darkColors : lightColors,
        isDark,
        palette,
    };
}