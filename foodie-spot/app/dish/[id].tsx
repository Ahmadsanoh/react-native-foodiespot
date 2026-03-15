import { useCart } from '@/contexts/cart-context';
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react-native";

import { restaurantAPI } from "@/services/api";
import { Dish } from "@/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { palette, radii, cardShadow } from "@/constants/theme";

export default function DishScreen() {
    const { id, restaurantId } = useLocalSearchParams<{ id: string; restaurantId: string }>();
    const [dish, setDish] = useState<Dish | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addItem, restaurantId: cartRestaurantId, clearCart } = useCart();

    const loadDish = useCallback(async () => {
        if (!restaurantId) {
            setError('Identifiant du restaurant manquant.');
            setLoading(false);
            return;
        }
        try {
            setError(null);
            const dishes = await restaurantAPI.getMenu(restaurantId);
            const found = dishes.find(d => d.id === id) ?? null;
            if (!found) setError('Plat introuvable.');
            setDish(found);
        } catch {
            setError('Impossible de charger le plat.');
        } finally {
            setLoading(false);
        }
    }, [id, restaurantId]);

    useEffect(() => { loadDish(); }, [loadDish]);

    const doAddToCart = () => {
        if (!dish) return;
        for (let i = 0; i < quantity; i++) {
            addItem(dish, restaurantId, dish.restaurantId ?? restaurantId);
        }
        Alert.alert(
            'Panier',
            `${quantity}× ${dish.name} ajouté au panier.`,
            [
                { text: 'Continuer', style: 'cancel' },
                { text: 'Voir le panier', onPress: () => router.push('/cart' as any) },
            ]
        );
    };

    const handleAddToCart = () => {
        if (!dish) return;

        // warn if switching restaurants
        if (cartRestaurantId && cartRestaurantId !== restaurantId) {
            Alert.alert(
                'Nouveau restaurant',
                "Votre panier contient des articles d'un autre restaurant. Voulez-vous le vider ?",
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Vider et ajouter',
                        style: 'destructive',
                        onPress: () => {
                            clearCart();
                            doAddToCart();
                        },
                    },
                ]
            );
            return;
        }

        doAddToCart();
    };

    if (loading) return <LoadingSpinner fullScreen text="Chargement du plat..." />;

    if (error || !dish) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#000" />
                </TouchableOpacity>
                <ErrorState message={error ?? 'Plat introuvable.'} onRetry={loadDish} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: dish.image }} style={styles.image} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={22} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.name}>{dish.name}</Text>
                    <Text style={styles.description}>{dish.description}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{dish.price.toFixed(2)} €</Text>
                        <View style={styles.qtyControls}>
                            <TouchableOpacity
                                style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
                                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus size={16} color={quantity <= 1 ? '#aaa' : '#fff'} />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyButton}
                                onPress={() => setQuantity(q => q + 1)}
                            >
                                <Plus size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                        <ShoppingCart size={18} color="#fff" />
                        <Text style={styles.addButtonText}>
                            Ajouter au panier — {(dish.price * quantity).toFixed(2)} €
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    imageWrapper: { position: 'relative' },
    image: { width: '100%', height: 280 },
    backButton: {
        position: 'absolute', top: 48, left: 16,
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center', justifyContent: 'center',
        ...cardShadow,
    },
    content: { padding: 20, gap: 12 },
    name: { fontSize: 24, fontWeight: 'bold' },
    description: { color: '#666', lineHeight: 22, fontSize: 15 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    price: { fontSize: 22, fontWeight: '700', color: palette.primary },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    qtyButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: palette.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    qtyButtonDisabled: { backgroundColor: '#ddd' },
    qtyValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
    addButton: {
        backgroundColor: palette.primary, borderRadius: radii.button,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, padding: 16, marginTop: 8,
    },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});