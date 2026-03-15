import React, { useState } from 'react';
import {
    Alert, Image, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Star } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import api, { uploadAPI } from '@/services/api';
import { palette, radii } from '@/constants/theme';

const CRITERIA = [
    { key: 'quality',      label: 'Qualité' },
    { key: 'speed',        label: 'Rapidité' },
    { key: 'presentation', label: 'Présentation' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => onChange(n)}>
                    <Star
                        size={28}
                        color={palette.accent}
                        fill={n <= value ? palette.accent : 'transparent'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function ReviewScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [globalRating, setGlobalRating] = useState(0);
    const [criteria, setCriteria] = useState<Record<string, number>>({
        quality: 0, speed: 0, presentation: 0,
    });
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', "Accès à vos photos requis.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
        });
        if (!result.canceled) {
            setPhotos(prev => [...prev, result.assets[0].uri]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (globalRating === 0) {
            Alert.alert('Note requise', 'Veuillez donner une note globale.');
            return;
        }
        setSubmitting(true);
        try {
            const uploadedUrls: string[] = [];
            for (const uri of photos) {
                const url = await uploadAPI.uploadImage(uri, 'review');
                uploadedUrls.push(url);
            }
            await api.post('/reviews', {
                orderId,
                rating: globalRating,
                criteria,
                comment: comment.trim(),
                photos: uploadedUrls,
            });
            Alert.alert('Merci !', 'Votre avis a été envoyé.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch {
            Alert.alert('Erreur', "Impossible d'envoyer l'avis. Réessayez.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Laisser un avis</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Global rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Note globale *</Text>
                    <StarRating value={globalRating} onChange={setGlobalRating} />
                    {globalRating > 0 && (
                        <Text style={styles.ratingLabel}>
                            {['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent'][globalRating]}
                        </Text>
                    )}
                </View>

                {/* Per-criterion ratings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes par critère</Text>
                    {CRITERIA.map(c => (
                        <View key={c.key} style={styles.criteriaRow}>
                            <Text style={styles.criteriaLabel}>{c.label}</Text>
                            <StarRating
                                value={criteria[c.key]}
                                onChange={v => setCriteria(prev => ({ ...prev, [c.key]: v }))}
                            />
                        </View>
                    ))}
                </View>

                {/* Comment */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Commentaire</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Partagez votre expérience..."
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{comment.length}/500</Text>
                </View>

                {/* Photos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <View style={styles.photosRow}>
                        {photos.map((uri, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => removePhoto(i)}
                                style={styles.photoWrapper}
                            >
                                <Image source={{ uri }} style={styles.photoThumb} />
                                <View style={styles.removeOverlay}>
                                    <Text style={styles.removeText}>✕</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {photos.length < 3 && (
                            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                                <Camera size={24} color="#999" />
                                <Text style={styles.addPhotoText}>Ajouter</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.photoHint}>Maximum 3 photos. Appuyez pour supprimer.</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitText}>
                        {submitting ? 'Envoi en cours...' : "Envoyer l'avis"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '700' },
    content: { padding: 16, gap: 24, paddingBottom: 40 },
    section: { gap: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    ratingLabel: { fontSize: 13, color: palette.primary, fontWeight: '600', marginTop: 4 },
    criteriaRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    criteriaLabel: { fontSize: 15, color: '#444' },
    commentInput: {
        backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14,
        fontSize: 15, minHeight: 100, textAlignVertical: 'top',
    },
    charCount: { fontSize: 12, color: '#999', textAlign: 'right' },
    photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoWrapper: { position: 'relative' },
    photoThumb: { width: 90, height: 90, borderRadius: 10 },
    removeOverlay: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 20, height: 20, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    removeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    addPhotoBtn: {
        width: 90, height: 90, borderRadius: 10,
        backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', gap: 4,
    },
    addPhotoText: { fontSize: 12, color: '#999' },
    photoHint: { fontSize: 12, color: '#999' },
    submitBtn: {
        backgroundColor: palette.primary, borderRadius: radii.button,
        padding: 16, alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});