import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/theme';

interface Props {
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<Props> = ({ text, fullScreen = false }) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color={palette.primary} />
    {text && <Text style={styles.text}>{text}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  fullScreen: { flex: 1 },
  text: { marginTop: 12, fontSize: 14, color: '#666' },
});