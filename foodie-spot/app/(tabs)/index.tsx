import { MapPin, Search } from 'lucide-react-native';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { CategoryList } from '@/components/category-list';
import { RestaurantCard } from '@/components/restaurant-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorState } from '@/components/error-state';
import { restaurantAPI, promoAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Restaurant, Promo, Category } from '@/types';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<string>('Localisation...');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [data, promos] = await Promise.all([
        restaurantAPI.getRestaurants(),
        promoAPI.getAvailablePromos().catch(() => []),
      ]);
      setRestaurants(data);
      if (promos.length > 0) setPromo(promos[0]);
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(async () => {
    const position = await locationService.getCurrentLocation();
    if (position) {
      const address = await locationService.reverseGeoCode(position);
      if (address) setLocation(address);
      const userCoords = { lat: position.latitude, lng: position.longitude };
      setCoords(userCoords);
      try {
        const data = await restaurantAPI.getRestaurants({
          lat: userCoords.lat,
          lng: userCoords.lng,
          radius: 10,
        });
        if (data.length > 0) setRestaurants(data);
      } catch { /* keep existing */ }
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { getLocation(); }, [getLocation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCategorySelect = useCallback(async (cat: Category | null) => {
    setSelectedCategory(cat);
    const filters = {
      ...(coords ? { lat: coords.lat, lng: coords.lng, radius: 10 } : {}),
      ...(cat ? { cuisine: cat.slug } : {}),
    };
    const data = await restaurantAPI.getRestaurants(filters);
    setRestaurants(data);
  }, [coords]);

  if (loading) return <LoadingSpinner fullScreen text="Chargement..." />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.primary }]}>
        <TouchableOpacity style={styles.locationContainer} onPress={getLocation}>
          <MapPin size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Livraison à</Text>
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search' as any)}
        >
          <Search size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>Rechercher un restaurant...</Text>
        </TouchableOpacity>
      </View>

      {/* CategoryList outside FlatList — stays visible when restaurants update */}
      <CategoryList
        onSelect={handleCategorySelect}
        selectedSlug={selectedCategory?.slug}
      />

      <FlatList
        data={restaurants}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
        ListHeaderComponent={
          <>
            {promo && (
              <View style={styles.promoBanner}>
                <Text style={styles.promoLabel}>Offre spéciale</Text>
                <Text style={styles.promoTitle}>{promo.description}</Text>
                <Text style={styles.promoCode}>Code : {promo.code}</Text>
              </View>
            )}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {selectedCategory ? selectedCategory.name : 'À proximité'}
            </Text>
            {error && <ErrorState message={error} onRetry={loadData} />}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurant/${item.id}` as any)}
            />
          </View>
        )}
        ListEmptyComponent={
          !error ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucun restaurant trouvé
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 20 },
  locationContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  locationLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  locationText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'rgba(0,0,0,0.5)' },
  promoBanner: {
    margin: 16, padding: 16,
    backgroundColor: palette.secondary, borderRadius: 16,
  },
  promoLabel: {
    fontSize: 10, fontWeight: '700', color: '#fff',
    letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase',
  },
  promoTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  promoCode: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, marginBottom: 4 },
  cardWrapper: { paddingHorizontal: 16 },
  emptyText: { textAlign: 'center', padding: 32 },
});