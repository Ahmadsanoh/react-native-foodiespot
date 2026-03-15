import React from 'react';
import {
    FlatList, StyleSheet, Text,
    TouchableOpacity, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';

import { useCart } from '@/contexts/cart-context';
import { EmptyState } from '@/components/empty-state';
import { palette, radii, cardShadow } from '@/constants/theme';

export default function CartScreen() {
    const {
        items, totalItems, totalPrice,
        restaurantName, updateQuantity, removeItem, clearCart,
    } = useCart();

    const handleClearCart = () => {
        Alert.alert(
            'Vider le panier',
            'Êtes-vous sûr de vouloir vider votre panier ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Vider', style: 'destructive', onPress: clearCart },
            ]
        );
    };

    const handleCheckout = () => {
        router.push('/checkout' as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Mon panier</Text>
                {items.length > 0 && (
                    <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
                        <Trash2 size={20} color={palette.error} />
                    </TouchableOpacity>
                )}
                {items.length === 0 && <View style={{ width: 38 }} />}
            </View>

            {items.length === 0 ? (
                <EmptyState
                    icon={<ShoppingBag size={64} color="#ccc" />}
                    title="Votre panier est vide"
                    subtitle="Parcourez les restaurants pour ajouter des plats"
                    actionLabel="Voir les restaurants"
                    onAction={() => router.replace('/(tabs)' as any)}
                />
            ) : (
                <>
                    {/* Restaurant name */}
                    {restaurantName && (
                        <View style={styles.restaurantBanner}>
                            <Text style={styles.restaurantLabel}>
                                Restaurant : {restaurantName}
                            </Text>
                        </View>
                    )}

                    {/* Cart items */}
                    <FlatList
                        data={items}
                        keyExtractor={item => item.dish.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.cartItem}>
                                <Image
                                    source={{ uri: item.dish.image }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>
                                        {item.dish.name}
                                    </Text>
                                    <Text style={styles.itemPrice}>
                                        {(item.dish.price * item.quantity).toFixed(2)} €
                                    </Text>
                                </View>
                                <View style={styles.qtyControls}>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.dish.id, item.quantity - 1)}
                                    >
                                        <Minus size={14} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                                    <TouchableOpacity
                                        style={styles.qtyBtn}
                                        onPress={() => updateQuantity(item.dish.id, item.quantity + 1)}
                                    >
                                        <Plus size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removeItem(item.dish.id)}
                                >
                                    <Trash2 size={16} color="#ccc" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />

                    {/* Summary + checkout */}
                    <View style={styles.footer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                {totalItems} article{totalItems > 1 ? 's' : ''}
                            </Text>
                            <Text style={styles.summaryTotal}>
                                {totalPrice.toFixed(2)} €
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.checkoutText}>
                                Commander — {totalPrice.toFixed(2)} €
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '700' },
    clearBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center',
    },
    restaurantBanner: {
        backgroundColor: palette.primaryLight,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    restaurantLabel: {
        fontSize: 13, color: palette.primary, fontWeight: '600',
    },
    list: { padding: 16, gap: 12, paddingBottom: 32 },
    cartItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: radii.card,
        padding: 12, gap: 12, ...cardShadow,
    },
    itemImage: { width: 60, height: 60, borderRadius: 10 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    itemPrice: { fontSize: 14, fontWeight: '700', color: palette.primary },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: palette.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    qtyValue: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
    removeBtn: { padding: 4 },
    footer: {
        backgroundColor: '#fff', padding: 16,
        borderTopWidth: 1, borderTopColor: '#f0f0f0',
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    summaryLabel: { fontSize: 15, color: '#666' },
    summaryTotal: { fontSize: 20, fontWeight: '700', color: palette.primary },
    checkoutBtn: {
        backgroundColor: palette.primary, borderRadius: radii.button,
        padding: 16, alignItems: 'center',
    },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});