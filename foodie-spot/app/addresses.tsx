import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, FlatList, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Home, MapPin, Plus, Star, Trash2 } from 'lucide-react-native';
import api from '@/services/api';
import { palette, radii, cardShadow } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Address } from '@/types';
import { LoadingSpinner } from '@/components/loading-spinner';
import { EmptyState } from '@/components/empty-state';

export default function AddressesScreen() {
    const { colors } = useAppTheme();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [saving, setSaving]       = useState(false);

    const [form, setForm] = useState({
        label: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'France',
    });

    const loadAddresses = useCallback(async () => {
        try {
            const response = await api.get('/users/addresses');
            setAddresses(response.data?.data ?? []);
        } catch {
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAddresses(); }, [loadAddresses]);

    const handleAdd = async () => {
        if (!form.street.trim() || !form.city.trim()) {
            Alert.alert('Champs requis', 'Veuillez renseigner la rue et la ville.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/users/addresses', {
                label: form.label || 'Maison',
                street: form.street.trim(),
                city: form.city.trim(),
                postalCode: form.postalCode.trim(),
                country: form.country,
            });
            setForm({ label: '', street: '', city: '', postalCode: '', country: 'France' });
            setShowForm(false);
            await loadAddresses();
        } catch {
            Alert.alert('Erreur', "Impossible d'ajouter l'adresse.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Supprimer', 'Supprimer cette adresse ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/users/addresses/${id}`);
                        await loadAddresses();
                    } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer.');
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (id: string) => {
        try {
            await api.put(`/users/addresses/${id}`, { isDefault: true });
            await loadAddresses();
        } catch {
            Alert.alert('Erreur', 'Impossible de définir comme adresse par défaut.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.input }]} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Mes adresses</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: palette.primaryLight }]}
                    onPress={() => setShowForm(v => !v)}
                >
                    <Plus size={20} color={palette.primary} />
                </TouchableOpacity>
            </View>

            {/* Add address form */}
            {showForm && (
                <View style={[styles.form, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <Text style={[styles.formTitle, { color: colors.text }]}>Nouvelle adresse</Text>

                    <TextInput
                        style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                        placeholder="Label (ex: Maison, Bureau)"
                        placeholderTextColor={colors.textTertiary}
                        value={form.label}
                        onChangeText={v => setForm(f => ({ ...f, label: v }))}
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
                        placeholder="Rue *"
                        placeholderTextColor={colors.textTertiary}
                        value={form.street}
                        onChangeText={v => setForm(f => ({ ...f, street: v }))}
                    />
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.inputHalf, { backgroundColor: colors.input, color: colors.text }]}
                            placeholder="Ville *"
                            placeholderTextColor={colors.textTertiary}
                            value={form.city}
                            onChangeText={v => setForm(f => ({ ...f, city: v }))}
                        />
                        <TextInput
                            style={[styles.input, styles.inputHalf, { backgroundColor: colors.input, color: colors.text }]}
                            placeholder="Code postal"
                            placeholderTextColor={colors.textTertiary}
                            value={form.postalCode}
                            onChangeText={v => setForm(f => ({ ...f, postalCode: v }))}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.formActions}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, { backgroundColor: colors.input }]}
                            onPress={() => setShowForm(false)}
                        >
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleAdd}
                            disabled={saving}
                        >
                            <Text style={styles.saveBtnText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {loading ? (
                <LoadingSpinner fullScreen text="Chargement des adresses..." />
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={a => a.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.addressCard, { backgroundColor: colors.card }, item.isDefault && styles.addressCardDefault]}>
                            <View style={styles.addressIcon}>
                                <MapPin size={20} color={item.isDefault ? palette.primary : colors.textSecondary} />
                            </View>
                            <View style={styles.addressInfo}>
                                <View style={styles.addressLabelRow}>
                                    <Text style={[styles.addressLabel, { color: colors.text }]}>
                                        {item.label || 'Adresse'}
                                    </Text>
                                    {item.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>Par défaut</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.addressStreet, { color: colors.textSecondary }]}>
                                    {item.street}
                                </Text>
                                <Text style={[styles.addressCity, { color: colors.textTertiary }]}>
                                    {item.postalCode} {item.city}, {item.country}
                                </Text>
                            </View>
                            <View style={styles.addressActions}>
                                {!item.isDefault && (
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleSetDefault(item.id)}
                                    >
                                        <Star size={16} color={colors.textTertiary} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Trash2 size={16} color={palette.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon={<Home size={48} color="#ccc" />}
                            title="Aucune adresse"
                            subtitle="Ajoutez une adresse de livraison"
                            actionLabel="Ajouter une adresse"
                            onAction={() => setShowForm(true)}
                        />
                    }
                />
            )}
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
    addBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
    },
    form: { padding: 16, borderBottomWidth: 1, gap: 10 },
    formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    input: {
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15,
    },
    row: { flexDirection: 'row', gap: 10 },
    inputHalf: { flex: 1 },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
        flex: 1, borderRadius: radii.button,
        paddingVertical: 12, alignItems: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '600' },
    saveBtn: {
        flex: 1, borderRadius: radii.button,
        paddingVertical: 12, alignItems: 'center',
        backgroundColor: palette.primary,
    },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    list: { padding: 16, gap: 12 },
    addressCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: radii.card, padding: 14, gap: 12,
        ...cardShadow,
    },
    addressCardDefault: {
        borderWidth: 1.5, borderColor: palette.primary,
    },
    addressIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: palette.primaryLight,
        alignItems: 'center', justifyContent: 'center',
    },
    addressInfo: { flex: 1 },
    addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    addressLabel: { fontSize: 15, fontWeight: '600' },
    defaultBadge: {
        backgroundColor: palette.primaryLight,
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
    },
    defaultBadgeText: { fontSize: 11, color: palette.primary, fontWeight: '600' },
    addressStreet: { fontSize: 13, marginBottom: 2 },
    addressCity: { fontSize: 12 },
    addressActions: { gap: 8 },
    actionBtn: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
});