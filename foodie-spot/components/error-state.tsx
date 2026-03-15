import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { palette } from '@/constants/theme';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<Props> = ({
  message = 'Une erreur est survenue.',
  onRetry,
}) => (
  <View style={styles.container}>
    <AlertCircle size={48} color={palette.error} />
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  message: { fontSize: 15, color: '#666', marginTop: 12, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 20, backgroundColor: palette.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});