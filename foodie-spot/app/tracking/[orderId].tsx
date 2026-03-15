import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, CheckCircle, Circle, Clock, MapPin, Phone } from "lucide-react-native";
import { Linking } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";

import { orderAPI } from "@/services/api";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorState } from "@/components/error-state";
import { palette, cardShadow } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const POLL_INTERVAL = 15000;

function formatTime(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function TrackingScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { colors } = useAppTheme();
    const [data, setData]             = useState<any | null>(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mapRef  = useRef<MapView>(null);

    const loadTracking = useCallback(async () => {
        try {
            setError(null);
            const result = await orderAPI.trackOrder(orderId);
            if (!result) throw new Error('Commande introuvable');
            setData(result);
        } catch (e: any) {
            setError(e.message ?? 'Impossible de charger le suivi.');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadTracking();
        pollRef.current = setInterval(loadTracking, POLL_INTERVAL);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [loadTracking]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTracking();
        setRefreshing(false);
    }, [loadTracking]);

    if (loading) return <LoadingSpinner fullScreen text="Chargement du suivi..." />;

    if (error || !data) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
                <ErrorState message={error ?? 'Suivi indisponible.'} onRetry={loadTracking} />
            </SafeAreaView>
        );
    }

    const deliveryAddr = typeof data.deliveryAddress === 'object'
        ? data.deliveryAddress?.street ?? JSON.stringify(data.deliveryAddress)
        : String(data.deliveryAddress ?? '');

    // Map coordinates
    const restaurantLat = data.restaurant?.location?.latitude ?? 48.8566;
    const restaurantLng = data.restaurant?.location?.longitude ?? 2.3522;
    const driverLat     = data.driverLocation?.latitude;
    const driverLng     = data.driverLocation?.longitude;
    const hasDriver     = driverLat !== undefined && driverLng !== undefined;

    const mapRegion = {
        latitude: hasDriver ? driverLat : restaurantLat,
        longitude: hasDriver ? driverLng : restaurantLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.input }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Suivi commande</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
                }
            >
                {/* Live map */}
                <View style={styles.mapCard}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_DEFAULT}
                        region={mapRegion}
                        showsUserLocation={false}
                        showsCompass={false}
                    >
                        {/* Restaurant marker */}
                        <Marker
                            coordinate={{ latitude: restaurantLat, longitude: restaurantLng }}
                            title={data.restaurant?.name ?? 'Restaurant'}
                            pinColor={palette.primary}
                        />

                        {/* Driver marker */}
                        {hasDriver && (
                            <Marker
                                coordinate={{ latitude: driverLat, longitude: driverLng }}
                                title="Livreur"
                                pinColor={palette.secondary}
                            />
                        )}

                        {/* Route line between restaurant and driver */}
                        {hasDriver && (
                            <Polyline
                                coordinates={[
                                    { latitude: restaurantLat, longitude: restaurantLng },
                                    { latitude: driverLat, longitude: driverLng },
                                ]}
                                strokeColor={palette.primary}
                                strokeWidth={3}
                                lineDashPattern={[6, 3]}
                            />
                        )}
                    </MapView>

                    {/* Map legend */}
                    <View style={styles.mapLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: palette.primary }]} />
                            <Text style={styles.legendText}>Restaurant</Text>
                        </View>
                        {hasDriver && (
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: palette.secondary }]} />
                                <Text style={styles.legendText}>Livreur</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ETA */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.orderNumber, { color: colors.text }]}>
                        Commande #{data.orderNumber ?? data.orderId?.slice(0, 8)}
                    </Text>
                    {data.estimatedMinutes !== undefined && (
                        <View style={styles.etaRow}>
                            <Clock size={16} color={palette.primary} />
                            <Text style={styles.eta}>
                                Livraison estimée dans {data.estimatedMinutes} min
                                {data.estimatedArrival ? ` (${formatTime(data.estimatedArrival)})` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Timeline */}
                {data.steps && data.steps.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Progression</Text>
                        {data.steps.map((step: any, i: number) => (
                            <View key={step.key} style={styles.step}>
                                <View style={styles.stepIcon}>
                                    {step.completed
                                        ? <CheckCircle size={20} color={palette.primary} />
                                        : <Circle size={20} color="#ccc" />
                                    }
                                    {i < data.steps.length - 1 && (
                                        <View style={[styles.stepLine, step.completed && styles.stepLineDone]} />
                                    )}
                                </View>
                                <View style={styles.stepText}>
                                    <Text style={[
                                        styles.stepLabel,
                                        { color: step.completed ? colors.text : colors.textTertiary },
                                        !step.completed && { fontWeight: '400' },
                                    ]}>
                                        {step.label}
                                    </Text>
                                    {step.time && (
                                        <Text style={[styles.stepTime, { color: colors.textTertiary }]}>
                                            {formatTime(step.time)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Driver info */}
                {data.driver && (
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Votre livreur</Text>
                        <View style={styles.driverRow}>
                            {data.driver.photo && (
                                <Image source={{ uri: data.driver.photo }} style={styles.driverPhoto} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.driverName, { color: colors.text }]}>{data.driver.name}</Text>
                                <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>{data.driver.vehicle}</Text>
                                {data.driver.rating && (
                                    <Text style={[styles.driverRating, { color: colors.textSecondary }]}>
                                        ⭐ {data.driver.rating.toFixed(1)}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.callBtn}
                                onPress={() => Linking.openURL(`tel:${data.driver.phone}`)}
                            >
                                <Phone size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Delivery address */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <View style={styles.addrRow}>
                        <MapPin size={18} color={palette.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.addrLabel, { color: colors.textTertiary }]}>
                                Adresse de livraison
                            </Text>
                            <Text style={[styles.addrValue, { color: colors.text }]}>{deliveryAddr}</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.refreshHint, { color: colors.textTertiary }]}>
                    Mise à jour automatique toutes les 15 secondes
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
    },
    content: { gap: 12, paddingBottom: 32 },
    mapCard: {
        height: 260,
        overflow: 'hidden',
    },
    map: { flex: 1 },
    mapLegend: {
        position: 'absolute', bottom: 8, left: 8,
        flexDirection: 'row', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: '#333', fontWeight: '500' },
    card: {
        marginHorizontal: 12, borderRadius: 16, padding: 16, ...cardShadow,
    },
    orderNumber: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eta: { fontSize: 15, color: palette.primary, fontWeight: '600' },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
    step: { flexDirection: 'row', marginBottom: 4 },
    stepIcon: { alignItems: 'center', marginRight: 12, width: 22 },
    stepLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginVertical: 2 },
    stepLineDone: { backgroundColor: palette.primary },
    stepText: { flex: 1, paddingBottom: 16 },
    stepLabel: { fontSize: 14, fontWeight: '600' },
    stepTime: { fontSize: 12, marginTop: 2 },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    driverPhoto: { width: 52, height: 52, borderRadius: 26 },
    driverName: { fontSize: 15, fontWeight: '600' },
    driverVehicle: { fontSize: 13 },
    driverRating: { fontSize: 13 },
    callBtn: {
        backgroundColor: palette.primary, width: 40, height: 40,
        borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    },
    addrRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    addrLabel: { fontSize: 12, marginBottom: 2 },
    addrValue: { fontSize: 15, fontWeight: '500' },
    refreshHint: { textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: 8 },
});