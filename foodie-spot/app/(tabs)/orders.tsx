import { OrderCard } from "@/components/order-card";
import { orderAPI } from "@/services/api";
import { Order } from "@/types";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShoppingBag } from 'lucide-react-native';
import { LoadingSpinner } from '@/components/loading-spinner';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type TabKey = 'active' | 'delivered' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'active',    label: 'En cours' },
    { key: 'delivered', label: 'Livrées' },
    { key: 'cancelled', label: 'Annulées' },
];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'on-the-way'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

function filterOrders(orders: Order[], tab: TabKey): Order[] {
    if (tab === 'active')    return orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (tab === 'delivered') return orders.filter(o => o.status === 'delivered');
    return orders.filter(o => o.status === 'cancelled');
}

export default function OrdersScreen() {
    const { colors } = useAppTheme();
    const [orders, setOrders]         = useState<Order[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [activeTab, setActiveTab]   = useState<TabKey>('active');

    const loadOrders = useCallback(async () => {
        setError(null);
        try {
            const data = await orderAPI.getOrders();
            setOrders(data);
        } catch {
            setError('Impossible de charger vos commandes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    }, [loadOrders]);

    const handlePress = (order: Order) => {
        if (ACTIVE_STATUSES.includes(order.status)) {
            router.push(`/tracking/${order.id}` as any);
        }
    };

    const handleCancel = (order: Order) => {
        if (!CANCELLABLE_STATUSES.includes(order.status)) {
            Alert.alert(
                'Annulation impossible',
                'Cette commande ne peut plus être annulée car elle est déjà en préparation.'
            );
            return;
        }
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await orderAPI.cancelOrder(order.id);
                            await loadOrders();
                            Alert.alert('Commande annulée', 'Votre commande a été annulée avec succès.');
                        } catch {
                            Alert.alert('Erreur', 'Impossible d\'annuler la commande.');
                        }
                    },
                },
            ]
        );
    };

    const filtered = filterOrders(orders, activeTab);

    if (loading) return <LoadingSpinner fullScreen text="Chargement des commandes..." />;
    if (error)   return <ErrorState message={error} onRetry={loadOrders} />;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Mes Commandes</Text>
            </View>

            <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: colors.textTertiary },
                            activeTab === tab.key && styles.tabTextActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={o => o.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
                }
                renderItem={({ item }) => (
                    <View>
                        <OrderCard order={item} onPress={() => handlePress(item)} />
                        {CANCELLABLE_STATUSES.includes(item.status) && (
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: colors.border }]}
                                onPress={() => handleCancel(item)}
                            >
                                <Text style={styles.cancelBtnText}>Annuler la commande</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon={<ShoppingBag size={64} color="#ccc" />}
                        title="Aucune commande"
                        subtitle={
                            activeTab === 'active'    ? "Pas de commande en cours." :
                            activeTab === 'delivered' ? "Pas encore de commande livrée." :
                            "Pas de commande annulée."
                        }
                        actionLabel="Commander maintenant"
                        onAction={() => router.replace('/(tabs)' as any)}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1,
    },
    title: { fontSize: 24, fontWeight: 'bold' },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: palette.primary },
    tabText: { fontSize: 14, fontWeight: '500' },
    tabTextActive: { color: palette.primary, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 32 },
    cancelBtn: {
        marginTop: -8, marginBottom: 12,
        marginHorizontal: 2,
        paddingVertical: 10,
        borderWidth: 1, borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
    },
    cancelBtnText: { color: palette.error, fontSize: 14, fontWeight: '600' },
});