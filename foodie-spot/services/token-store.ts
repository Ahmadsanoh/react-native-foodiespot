import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from './storage';

export const tokenStore = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },
};