import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { CartProvider } from '@/contexts/cart-context';
import { useTheme, ThemeProvider as AppThemeProvider } from '@/contexts/theme-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ToastProvider } from '@/components/toast-provider';
import { useOffline } from '@/hooks/use-offline';
import { Colors } from '@/constants/theme';

const PROTECTED_ROUTES = ['(tabs)', 'cart', 'checkout', 'restaurant', 'dish', 'tracking', 'review', 'addresses'];
const AUTH_ROUTES = ['(auth)', 'login', 'register'];

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutContent() {
  const { theme: colorScheme } = useTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0] as string | undefined;
    if (segment === undefined) return;

    const isProtected = PROTECTED_ROUTES.some(r => segment === r || segment?.startsWith(r));
    const isAuth = AUTH_ROUTES.includes(segment);

    if (!isAuthenticated && isProtected && !isNavigating.current) {
      isNavigating.current = true;
      router.replace('/(auth)' as any);
      setTimeout(() => { isNavigating.current = false; }, 500);
    } else if (isAuthenticated && isAuth && !isNavigating.current) {
      isNavigating.current = true;
      router.replace('/(tabs)' as any);
      setTimeout(() => { isNavigating.current = false; }, 500);
    }
  }, [segments, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🍔</Text>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
          </Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncNow} disabled={isSyncing}>
          <Ionicons name={isSyncing ? 'sync' : 'sync-outline'} size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {isSyncing ? 'Synchronisation...' : `Synchroniser ${pendingCount} action(s)`}
          </Text>
        </TouchableOpacity>
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dish/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracking/[orderId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="review/[orderId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="addresses" options={{ animation: 'slide_from_right' }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingLogo: { fontSize: 64, marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  syncBanner: { backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <RootLayoutContent />
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}