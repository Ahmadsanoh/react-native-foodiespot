import React, { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { orderAPI, promoAPI } from '@/services/api';
import {
    ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Tag, CheckCircle, XCircle } from 'lucide-react-native';
import { palette, radii } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Promo } from '@/types';
import { Image } from 'expo-image';

export default function CheckoutScreen() {
    const { colors } = useAppTheme();
    const { items, totalPrice, restaurantName, clearCart } = useCart();

    const [promoCode, setPromoCode]     = useState('');
    const [promoResult, setPromoResult] = useState<Promo | null>(null);
    const [promoError, setPromoError]   = useState<string | null>(null);
    const [checking, setChecking]       = useState(false);
    const [ordering, setOrdering]       = useState(false);

    const subtotal    = totalPrice;
    const deliveryFee = subtotal > 0 ? 3.50 : 0;

    // calculate discount based on promo type
    const getDiscount = (promo: Promo | null): number => {
        if (!promo) return 0;
        if (promo.type === 'percent') {
            return Math.min(
                (subtotal * promo.discount) / 100,
                promo.maxDiscount ?? Infinity
            );
        }
        if (promo.type === 'delivery') return deliveryFee;
        if (promo.type === 'fixed') return promo.discount;
        return 0;
    };

    const discount = getDiscount(promoResult);
    const total    = Math.max(0, subtotal + deliveryFee - discount);

    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        if (subtotal === 0) {
            setPromoError("Ajoutez des articles au panier d'abord.");
            return;
        }
        setChecking(true);
        setPromoResult(null);
        setPromoError(null);
        try {
            const result = await promoAPI.validatePromo(promoCode.trim(), subtotal);
            console.log('PROMO RESULT:', JSON.stringify(result));
            if (result.valid && result.promo) {
                setPromoResult(result.promo);
            } else {
                setPromoError(result.message ?? 'Code invalide');
            }
        } catch {
            setPromoError('Erreur lors de la validation');
        } finally {
            setChecking(false);
        }
    };

    const removePromo = () => {
        setPromoResult(null);
        setPromoError(null);
        setPromoCode('');
    };

    const handleConfirm = async () => {
        if (items.length === 0) {
            Alert.alert('Panier vide', 'Ajoutez des articles avant de commander.');
            return;
        }
        setOrdering(true);
        try {
            const order = await orderAPI.createOrder({
                restaurantId: items[0].restaurantId,
                items: items.map(i => ({
                    menuItemId: i.dish.id,
                    quantity: i.quantity,
                })),
                deliveryAddress: {
                    street: '15 avenue des Champs-Élysées',
                    city: 'Paris',
                    postalCode: '75001',
                    country: 'France',
                },
                paymentMethod: 'card',
                promoCode: promoResult?.code,
            });
            clearCart();
            Alert.alert(
                'Commande confirmée !',
                `Commande #${order.orderNumber ?? order.id?.slice(0, 8)} passée avec succès.`,
                [{
                    text: 'Suivre ma commande',
                    onPress: () => router.replace('/(tabs)/orders' as any),
                }]
            );
        } catch (e: any) {
            Alert.alert(
                'Erreur',
                e.response?.data?.message ?? e.message ?? 'Impossible de passer la commande.'
            );
        } finally {
            setOrdering(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.cardAlt }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: colors.input }]}
                >
                    <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Paiement</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Cart items */}
                {items.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            {restaurantName ?? 'Votre commande'}
                        </Text>
                        {items.map(item => (
                            <View key={item.dish.id} style={styles.cartRow}>
                                <Image source={{ uri: item.dish.image }} style={styles.itemImage} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                                        {item.dish.name}
                                    </Text>
                                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                                        x{item.quantity}
                                    </Text>
                                </View>
                                <Text style={styles.itemPrice}>
                                    {(item.dish.price * item.quantity).toFixed(2)} €
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Order summary */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Récapitulatif</Text>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Sous-total</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>{subtotal.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Livraison</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>
                            {promoResult?.type === 'delivery' ? (
                                <Text>
                                    <Text style={{ textDecorationLine: 'line-through', color: colors.textTertiary }}>
                                        {deliveryFee.toFixed(2)} €
                                    </Text>
                                    {'  '}
                                    <Text style={{ color: palette.success }}>Gratuit</Text>
                                </Text>
                            ) : `${deliveryFee.toFixed(2)} €`}
                        </Text>
                    </View>
                    {discount > 0 && promoResult?.type !== 'delivery' && (
                        <View style={styles.row}>
                            <Text style={[styles.rowLabel, { color: palette.success }]}>
                                Réduction ({promoResult?.code})
                            </Text>
                            <Text style={[styles.rowValue, { color: palette.success }]}>
                                -{discount.toFixed(2)} €
                            </Text>
                        </View>
                    )}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.row}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                        <Text style={styles.totalValue}>{total.toFixed(2)} €</Text>
                    </View>
                </View>

                {/* Promo code */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Code promo</Text>

                    {promoResult ? (
                        <View style={styles.promoApplied}>
                            <CheckCircle size={20} color={palette.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.promoAppliedCode}>{promoResult.code}</Text>
                                <Text style={[styles.promoAppliedDesc, { color: colors.textSecondary }]}>
                                    {promoResult.description}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={removePromo}>
                                <XCircle size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.promoRow, { backgroundColor: colors.input }]}>
                                <Tag size={18} color={colors.textTertiary} />
                                <TextInput
                                    style={[styles.promoInput, { color: colors.text }]}
                                    placeholder="Entrez un code promo"
                                    placeholderTextColor={colors.textTertiary}
                                    value={promoCode}
                                    onChangeText={v => {
                                        setPromoCode(v.toUpperCase());
                                        setPromoError(null);
                                    }}
                                    autoCapitalize="characters"
                                    returnKeyType="done"
                                    onSubmitEditing={validatePromo}
                                />
                                <TouchableOpacity
                                    style={[styles.promoBtn, checking && styles.promoBtnDisabled]}
                                    onPress={validatePromo}
                                    disabled={checking || !promoCode.trim()}
                                >
                                    <Text style={styles.promoBtnText}>
                                        {checking ? '...' : 'Appliquer'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {promoError && (
                                <View style={styles.promoErrorRow}>
                                    <XCircle size={14} color={palette.error} />
                                    <Text style={styles.promoErrorText}>{promoError}</Text>
                                </View>
                            )}
                        </>
                    )}
                    <Text style={[styles.promoHint, { color: colors.textTertiary }]}>
                        Essayez : BIENVENUE30 ou LIVRAISON
                    </Text>
                </View>

                {/* Confirm button */}
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        (items.length === 0 || ordering) && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={items.length === 0 || ordering}
                >
                    <Text style={styles.confirmText}>
                        {ordering
                            ? 'Traitement...'
                            : items.length === 0
                            ? 'Panier vide'
                            : `Commander — ${total.toFixed(2)} €`
                        }
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '700' },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: {
        borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
    cartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    itemImage: { width: 44, height: 44, borderRadius: 8 },
    itemName: { fontSize: 14, fontWeight: '500' },
    itemQty: { fontSize: 12, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '700', color: palette.primary },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    rowLabel: { fontSize: 14 },
    rowValue: { fontSize: 14 },
    divider: { height: 1, marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: '700' },
    totalValue: { fontSize: 16, fontWeight: '700', color: palette.primary },
    promoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 8,
    },
    promoInput: { flex: 1, fontSize: 15, paddingVertical: 12 },
    promoBtn: {
        backgroundColor: palette.primary,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    },
    promoBtnDisabled: { opacity: 0.5 },
    promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    promoErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    promoErrorText: { fontSize: 13, color: palette.error },
    promoApplied: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F0FFF4', borderRadius: 12, padding: 12, marginBottom: 8,
    },
    promoAppliedCode: { fontSize: 14, fontWeight: '700', color: palette.success },
    promoAppliedDesc: { fontSize: 12 },
    promoHint: { fontSize: 12, marginTop: 4 },
    confirmBtn: {
        backgroundColor: palette.primary, borderRadius: radii.button,
        padding: 16, alignItems: 'center',
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});