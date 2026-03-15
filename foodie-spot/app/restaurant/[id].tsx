import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Dish, Restaurant } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { restaurantAPI, userAPI } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Phone, Share2, Star } from "lucide-react-native";
import { DishCard } from "@/components/dish-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { palette, cardShadow, radii } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import api from "@/services/api";

function formatDeliveryTime(t: { min: number; max: number } | number): string {
    if (typeof t === 'object') return `${t.min}–${t.max}`;
    return String(t);
}

interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

function StarRow({ rating }: { rating: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star
                    key={n}
                    size={14}
                    color={palette.accent}
                    fill={n <= rating ? palette.accent : 'transparent'}
                />
            ))}
        </View>
    );
}

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useAppTheme();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menu, setMenu]             = useState<Dish[]>([]);
    const [reviews, setReviews]       = useState<Review[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);

    const loadRestaurant = useCallback(async () => {
        try {
            setError(null);
            const [restaurantData, menuData, reviewsResponse] = await Promise.all([
                restaurantAPI.getRestaurantById(id),
                restaurantAPI.getMenu(id),
                api.get(`/restaurants/${id}/reviews`).catch(() => ({ data: { data: [] } })),
            ]);
            setRestaurant(restaurantData);
            setMenu(menuData);
            setReviews(reviewsResponse.data?.data ?? []);
            setIsFavorite(restaurantData?.isFavorite || false);
        } catch {
            setError('Impossible de charger le restaurant.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadRestaurant(); }, [loadRestaurant]);

    const handleToggleFavorite = async () => {
        try {
            await userAPI.toggleFavorite(id);
            setIsFavorite(prev => !prev);
        } catch {
            Alert.alert("Erreur", "Impossible de mettre à jour les favoris.");
        }
    };

    const handleDirections = () => {
        if (!restaurant) return;
        const addr = encodeURIComponent(restaurant.address);
        const url = Platform.OS === 'ios' ? `maps://?q=${addr}` : `geo:0,0?q=${addr}`;
        Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${addr}`));
    };

    const handleCall = () => {
        if (!restaurant?.phone) { Alert.alert('Téléphone', 'Numéro non disponible.'); return; }
        Linking.openURL(`tel:${restaurant.phone}`);
    };

    const handleShare = async () => {
        if (!restaurant) return;
        try {
            await Share.share({ title: restaurant.name, message: `Découvrez ${restaurant.name} sur FoodieSpot !` });
        } catch { /* cancelled */ }
    };

    // calculate delivery fee based on distance
    const deliveryFee = restaurant?.deliveryFee != null
        ? restaurant.deliveryFee
        : (2.99 + (restaurant?.distance ?? 1) * 0.5);

    if (loading) return <LoadingSpinner fullScreen text="Chargement..." />;

    if (error || !restaurant) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
                <ErrorState message={error ?? 'Restaurant introuvable.'} onRetry={loadRestaurant} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: restaurant.image }} style={styles.image} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#000" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
                            <Heart size={22} color={isFavorite ? palette.primary : '#000'} fill={isFavorite ? palette.primary : 'transparent'} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <Share2 size={18} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info */}
                <View style={[styles.info, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
                    <Text style={[styles.cuisine, { color: colors.textSecondary }]}>
                        {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}
                    </Text>
                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={15} color="#FFC107" fill="#FFC107" />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {restaurant.rating.toFixed(1)} ({restaurant.reviewCount ?? 0})
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={15} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {formatDeliveryTime(restaurant.deliveryTime)} min
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MapPin size={15} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {restaurant.distance ?? '–'} km
                            </Text>
                        </View>
                    </View>

                    {/* Delivery estimate card */}
                    <View style={[styles.estimateRow, { backgroundColor: colors.cardAlt }]}>
                        <View style={styles.estimateItem}>
                            <Clock size={16} color={palette.primary} />
                            <View>
                                <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>
                                    Livraison
                                </Text>
                                <Text style={[styles.estimateValue, { color: colors.text }]}>
                                    {formatDeliveryTime(restaurant.deliveryTime)} min
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.estimateItem}>
                            <MapPin size={16} color={palette.primary} />
                            <View>
                                <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>
                                    Distance
                                </Text>
                                <Text style={[styles.estimateValue, { color: colors.text }]}>
                                    {restaurant.distance ?? '–'} km
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.estimateDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.estimateItem}>
                            <Text style={styles.estimateIcon}>💶</Text>
                            <View>
                                <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>
                                    Frais
                                </Text>
                                <Text style={[styles.estimateValue, { color: colors.text }]}>
                                    {deliveryFee.toFixed(2)} €
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Minimum order info */}
                    {restaurant.minimumOrder && (
                        <Text style={[styles.minOrder, { color: colors.textTertiary }]}>
                            Commande minimum : {restaurant.minimumOrder.toFixed(2)} €
                        </Text>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleDirections}>
                            <Navigation size={16} color="#fff" />
                            <Text style={styles.primaryButtonText}>Itinéraire</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.input }]} onPress={handleCall}>
                            <Phone size={16} color={colors.textSecondary} />
                            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Appeler</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Menu */}
                <View style={[styles.section, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu</Text>
                    {menu.length === 0 && (
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                            Aucun plat disponible.
                        </Text>
                    )}
                    {menu.map(dish => (
                        <DishCard
                            key={dish.id}
                            dish={dish}
                            onPress={() => router.push(`/dish/${dish.id}?restaurantId=${id}` as any)}
                        />
                    ))}
                </View>

                {/* Reviews */}
                {reviews.length > 0 && (
                    <View style={[styles.section, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Avis ({reviews.length})
                        </Text>
                        {reviews.map(review => (
                            <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.cardAlt }]}>
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                                        {review.userName}
                                    </Text>
                                    <StarRow rating={review.rating} />
                                </View>
                                {review.comment && (
                                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                                        {review.comment}
                                    </Text>
                                )}
                                <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    imageContainer: { position: 'relative', height: 240 },
    image: { width: '100%', height: '100%' },
    backButton: {
        position: 'absolute', top: 48, left: 16,
        backgroundColor: '#fff', borderRadius: 20,
        padding: 8, ...cardShadow,
    },
    headerActions: {
        position: 'absolute', top: 48, right: 16,
        flexDirection: 'row', gap: 8,
    },
    actionButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#fff', alignItems: 'center',
        justifyContent: 'center', ...cardShadow,
    },
    info: { padding: 16, borderBottomWidth: 1 },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    cuisine: { fontSize: 15, marginBottom: 12 },
    meta: { flexDirection: 'row', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 14 },
    estimateRow: {
        flexDirection: 'row', borderRadius: 12,
        paddingVertical: 12, paddingHorizontal: 8,
        marginBottom: 16,
    },
    estimateItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    estimateDivider: { width: 1, marginHorizontal: 4 },
    estimateLabel: { fontSize: 11 },
    estimateValue: { fontSize: 13, fontWeight: '600' },
    estimateIcon: { fontSize: 16 },
    minOrder: { fontSize: 12, marginBottom: 16, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 12 },
    primaryButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: palette.primary, borderRadius: radii.button, paddingVertical: 12,
    },
    primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    secondaryButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        borderRadius: radii.button, paddingVertical: 12,
    },
    secondaryButtonText: { fontSize: 15, fontWeight: '600' },
    section: { padding: 16, borderTopWidth: 1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    emptyText: { textAlign: 'center', paddingVertical: 24 },
    reviewCard: { borderRadius: 12, padding: 14, marginBottom: 12 },
    reviewHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    reviewAuthor: { fontSize: 14, fontWeight: '700' },
    reviewComment: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
    reviewDate: { fontSize: 12 },
});