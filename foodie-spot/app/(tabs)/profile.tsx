import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Heart, ShoppingBag, Phone, Share2, Camera, ChevronRight, LogOut } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/theme-context';
import { useAppTheme } from '@/hooks/use-app-theme';
import { userAPI, uploadAPI, orderAPI } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/toast-provider';
import { LoadingSpinner } from '@/components/loading-spinner';
import { palette } from '@/constants/theme';
import type { User } from '@/types';
import log from '@/services/logger';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const toast = useToast();
  const { themeMode, setThemeMode } = useTheme();
  const { colors, isDark } = useAppTheme();
  const [user, setUser] = useState<User | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const [userData, orders] = await Promise.all([
        userAPI.getProfile(),
        orderAPI.getOrders(),
      ]);
      if (userData) {
        setUser({
          ...userData,
          favoriteRestaurants: userData.favoriteRestaurants ?? [],
          addresses: userData.addresses ?? [],
        });
      }
      setOrderCount(orders.filter(o => o.status === 'delivered').length);
    } catch (err) {
      log.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin d'accéder à vos photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      try {
        const imageUrl = await uploadAPI.uploadImage(result.assets[0].uri, 'profile');
        await userAPI.updateProfile({ photo: imageUrl });
        await loadProfile();
        toast.success('Photo de profil mise à jour !');
      } catch (error) {
        log.error('Failed to upload profile photo:', error);
        Alert.alert('Erreur', 'Impossible de télécharger la photo');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen text="Chargement du profil..." />;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Profil non disponible.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user.name ?? user.firstName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
                <Camera size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
            {user.phone && <Text style={[styles.phone, { color: colors.textTertiary }]}>{user.phone}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.stats, { backgroundColor: colors.cardAlt }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Commandes</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.favoriteRestaurants.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoris</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.addresses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Adresses</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={[styles.menu, { backgroundColor: colors.card }]}>

          {/* Mes adresses — navigates to addresses screen */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/addresses' as any)}
          >
            <MapPin size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Mes adresses</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: isDark ? '#2D1F17' : '#FFE5DB' }]}>
                <Text style={styles.badgeText}>{user.addresses.length}</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/orders' as any)}
          >
            <Heart size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Mes favoris</Text>
            <View style={styles.menuRight}>
              <View style={[styles.badge, { backgroundColor: isDark ? '#2D1F17' : '#FFE5DB' }]}>
                <Text style={styles.badgeText}>{user.favoriteRestaurants.length}</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/(tabs)/orders' as any)}
          >
            <ShoppingBag size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Historique</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => Alert.alert('Support', 'Pour toute assistance, contactez support@foodiespot.fr')}
          >
            <Phone size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Support</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <Share2 size={20} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Partager l'app</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Theme toggle */}
          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.themeIconContainer, { backgroundColor: isDark ? '#2D1F17' : palette.primaryLight }]}>
              <Text style={styles.themeIcon}>
                {themeMode === 'dark' ? '🌙' : themeMode === 'light' ? '☀️' : '⚙️'}
              </Text>
            </View>
            <Text style={[styles.menuText, { color: colors.text, marginLeft: 12 }]}>Apparence</Text>
            <View style={[styles.themeSwitcher, { backgroundColor: colors.input }]}>
              {([
                { mode: 'light', icon: '☀️', label: 'Clair' },
                { mode: 'system', icon: '⚙️', label: 'Auto' },
                { mode: 'dark', icon: '🌙', label: 'Sombre' },
              ] as const).map(({ mode, icon, label }) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    themeMode === mode && [
                      styles.themeOptionActive,
                      { backgroundColor: isDark ? '#374151' : '#ffffff' },
                    ],
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Text style={styles.themeOptionIcon}>{icon}</Text>
                  <Text style={[
                    styles.themeOptionLabel,
                    { color: colors.textTertiary },
                    themeMode === mode && { color: palette.primary, fontWeight: '700' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <LogOut size={20} color={palette.primary} />
            <Text style={[styles.menuText, styles.logoutText]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { padding: 20, alignItems: 'center' },
  profileContainer: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  cameraButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 2 },
  phone: { fontSize: 13 },
  stats: {
    flexDirection: 'row', marginHorizontal: 16,
    marginBottom: 20, borderRadius: 16, padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: palette.primary, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  menu: { borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1,
  },
  menuText: { flex: 1, fontSize: 16 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 12, color: palette.primary, fontWeight: '600' },
  themeIconContainer: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  themeIcon: { fontSize: 18 },
  themeSwitcher: {
    flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2,
  },
  themeOption: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, gap: 2,
  },
  themeOptionActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  themeOptionIcon: { fontSize: 14 },
  themeOptionLabel: { fontSize: 10, fontWeight: '500' },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: palette.primary, fontWeight: '600' },
});