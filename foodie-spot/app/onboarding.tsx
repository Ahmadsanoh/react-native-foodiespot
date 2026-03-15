import React, { useRef, useState } from 'react';
import {
    Dimensions, FlatList, StyleSheet, Text,
    TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { palette } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '🍔',
        title: 'Bienvenue sur FoodieSpot',
        subtitle: 'Commandez vos plats préférés auprès des meilleurs restaurants de votre ville.',
    },
    {
        id: '2',
        emoji: '🚴',
        title: 'Livraison rapide',
        subtitle: 'Suivez votre commande en temps réel et recevez vos plats chauds à domicile.',
    },
    {
        id: '3',
        emoji: '⭐',
        title: 'Offres exclusives',
        subtitle: "Profitez de codes promo et d'offres spéciales réservées à nos membres.",
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        }
    };

    const finish = async () => {
        await storage.setItem(STORAGE_KEYS.ONBOARDING_DONE, true);
        router.replace('/(auth)' as any);
    };

    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <SafeAreaView style={styles.container}>
            {!isLast && (
                <TouchableOpacity style={styles.skipBtn} onPress={finish}>
                    <Text style={styles.skipText}>Passer</Text>
                </TouchableOpacity>
            )}

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>
                )}
            />

            <View style={styles.dots}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === currentIndex && styles.dotActive]}
                    />
                ))}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={isLast ? finish : handleNext}
            >
                <Text style={styles.buttonText}>
                    {isLast ? 'Commencer' : 'Suivant'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
    skipBtn: { alignSelf: 'flex-end', padding: 16 },
    skipText: { fontSize: 14, color: '#999' },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emoji: { fontSize: 96, marginBottom: 32 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#111' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
    dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
    dotActive: { backgroundColor: palette.primary, width: 24 },
    button: {
        backgroundColor: palette.primary,
        paddingHorizontal: 48, paddingVertical: 16,
        borderRadius: 12, marginBottom: 32,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});