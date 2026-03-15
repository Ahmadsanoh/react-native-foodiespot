import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RestaurantCard } from '@/components/restaurant-card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { EmptyState } from '@/components/empty-state';
import { palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { restaurantAPI } from '@/services/api';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { Category, Restaurant } from '@/types';
import { Clock, Filter, Mic, MicOff, Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEBOUNCE_MS = 350;

export default function SearchScreen() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const [query, setQuery] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        restaurantAPI.getCategories().then(setCategories);
        storage.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES).then(r => setRecentSearches(r ?? []));
    }, []);

    const saveSearch = useCallback(async (q: string) => {
        if (!q.trim()) return;
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8);
        setRecentSearches(updated);
        await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    }, [recentSearches]);

    const doSearch = useCallback(async (q: string, cuisine?: string | null) => {
        setLoading(true);
        try {
            let data: Restaurant[];
            if (q.trim()) {
                data = await restaurantAPI.searchRestaurants(q.trim());
            } else {
                data = await restaurantAPI.getRestaurants(cuisine ? { cuisine } : {});
            }
            setRestaurants(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            doSearch(query, selectedCuisine);
        }, DEBOUNCE_MS);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, selectedCuisine, doSearch]);

    const handleSubmit = () => { if (query.trim()) saveSearch(query.trim()); };

    const removeRecent = async (s: string) => {
        const updated = recentSearches.filter(r => r !== s);
        setRecentSearches(updated);
        await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
    };

    const clearAllRecent = async () => {
        setRecentSearches([]);
        await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, []);
    };

    const toggleCuisine = (slug: string) => {
        setSelectedCuisine(prev => prev === slug ? null : slug);
    };

    const clearQuery = () => {
        setQuery('');
        setSelectedCuisine(null);
        setRestaurants([]);
    };

    const handleVoiceSearch = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }
        setIsListening(true);
        Alert.alert(
            '🎤 Recherche vocale',
            'Que recherchez-vous ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                    onPress: () => setIsListening(false),
                },
                {
                    text: '🍔 Burger',
                    onPress: () => {
                        setQuery('Burger');
                        saveSearch('Burger');
                        setIsListening(false);
                    },
                },
                {
                    text: '🍕 Pizza',
                    onPress: () => {
                        setQuery('Pizza');
                        saveSearch('Pizza');
                        setIsListening(false);
                    },
                },
                {
                    text: '🍣 Sushi',
                    onPress: () => {
                        setQuery('Sushi');
                        saveSearch('Sushi');
                        setIsListening(false);
                    },
                },
            ]
        );
    };

    const showRecents = !query && !selectedCuisine && recentSearches.length > 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Search bar */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.input }]}>
                    <Search size={20} color={colors.textTertiary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Rechercher un restaurant"
                        placeholderTextColor={colors.textTertiary}
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSubmit}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearQuery}>
                            <X size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                    {/* Voice search button */}
                    <TouchableOpacity onPress={handleVoiceSearch} style={styles.micBtn}>
                        {isListening
                            ? <MicOff size={18} color={palette.primary} />
                            : <Mic size={18} color={colors.textTertiary} />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: showFilters ? palette.primary : colors.input },
                    ]}
                    onPress={() => setShowFilters(v => !v)}
                >
                    <Filter size={22} color={showFilters ? '#fff' : colors.text} />
                </TouchableOpacity>
            </View>

            {/* Cuisine chips */}
            {showFilters && categories.length > 0 && (
                <View style={[styles.filtersRow, { borderBottomColor: colors.border }]}>
                    <FlatList
                        data={categories}
                        keyExtractor={c => c.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContent}
                        renderItem={({ item }) => {
                            const active = selectedCuisine === item.slug;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        { backgroundColor: active ? palette.primary : colors.input },
                                    ]}
                                    onPress={() => toggleCuisine(item.slug)}
                                >
                                    <Text style={styles.filterChipIcon}>{item.icon}</Text>
                                    <Text style={[
                                        styles.filterChipText,
                                        { color: active ? '#fff' : colors.textSecondary },
                                        active && { fontWeight: '600' },
                                    ]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            )}

            {/* Recent searches */}
            {showRecents && (
                <View style={[styles.recentsContainer, { borderBottomColor: colors.border }]}>
                    <View style={styles.recentsHeader}>
                        <Text style={[styles.recentsTitle, { color: colors.textTertiary }]}>
                            Recherches récentes
                        </Text>
                        <TouchableOpacity onPress={clearAllRecent}>
                            <Text style={[styles.clearAll, { color: palette.primary }]}>Tout effacer</Text>
                        </TouchableOpacity>
                    </View>
                    {recentSearches.map(s => (
                        <View key={s} style={styles.recentItem}>
                            <TouchableOpacity
                                style={styles.recentLeft}
                                onPress={() => setQuery(s)}
                            >
                                <Clock size={15} color={colors.textTertiary} />
                                <Text style={[styles.recentText, { color: colors.text }]}>{s}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeRecent(s)}>
                                <X size={15} color={colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Results */}
            {loading ? (
                <LoadingSpinner text="Recherche en cours..." />
            ) : (
                <FlatList
                    data={restaurants}
                    keyExtractor={r => r.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        restaurants.length > 0 ? (
                            <Text style={[styles.resultsText, { color: colors.textTertiary }]}>
                                {restaurants.length} {restaurants.length > 1 ? 'restaurants trouvés' : 'restaurant trouvé'}
                            </Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <RestaurantCard
                            restaurant={item}
                            onPress={() => router.push(`/restaurant/${item.id}` as any)}
                        />
                    )}
                    ListEmptyComponent={
                        (query || selectedCuisine) ? (
                            <EmptyState
                                icon={<Search size={48} color="#ccc" />}
                                title="Aucun résultat"
                                subtitle={`Aucun restaurant trouvé pour « ${query || selectedCuisine} »`}
                                actionLabel="Effacer la recherche"
                                onAction={clearQuery}
                            />
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderBottomWidth: 1,
    },
    searchContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12,
    },
    searchInput: { flex: 1, fontSize: 16 },
    micBtn: { padding: 2 },
    filterButton: { padding: 10, borderRadius: 12 },
    filtersRow: { borderBottomWidth: 1 },
    filtersContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    filterChipIcon: { fontSize: 14 },
    filterChipText: { fontSize: 14 },
    recentsContainer: { padding: 16, borderBottomWidth: 1 },
    recentsHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    recentsTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
    clearAll: { fontSize: 13, fontWeight: '600' },
    recentItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 10,
    },
    recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    recentText: { fontSize: 15 },
    list: { padding: 16 },
    resultsText: { fontSize: 13, marginBottom: 12 },
});