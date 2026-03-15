import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { restaurantAPI } from '@/services/api';
import { Category } from '@/types';
import { palette } from '@/constants/theme';

interface Props {
  onSelect?: (category: Category | null) => void;
  selectedSlug?: string | null;
}

export const CategoryList: React.FC<Props> = ({ onSelect, selectedSlug }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    // load from API — no hardcoded data
    const data = await restaurantAPI.getCategories();
    setCategories(data);
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catégories</Text>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = selectedSlug === item.slug;
          return (
            <TouchableOpacity
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect?.(isActive ? null : item)}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: palette.primaryLight,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, marginRight: 12,
  },
  chipActive: { backgroundColor: palette.primary },
  icon: { fontSize: 16 },
  chipText: { color: palette.primary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});