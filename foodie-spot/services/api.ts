import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

import { storage, STORAGE_KEYS } from '@/services/storage';
import { tokenStore } from './token-store';
import { Dish, Order, Promo, Restaurant, SearchFilters, User } from '@/types';
import log from './logger';
import config from '@/constants/config';

const api = axios.create({
    baseURL: config.API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
    async requestConfig => {
        let token: string | null = null;
        try {
            token = await tokenStore.getAccessToken();
            if (!token) {
                token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
            }
        } catch (e) {
            token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
        }
        if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response && error.response.status === 401) {
            await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
};

// ─────────────────────────────────────────────
// Restaurant API
// ─────────────────────────────────────────────
export const restaurantAPI = {

    async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : [];
        }
        try {
            const response = await api.get('/restaurants', { params: filters });
            const restaurants = response.data?.data || [];
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            log.error('Failed to fetch restaurants', error);
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : [];
        }
    },

    async searchRestaurants(query: string): Promise<Restaurant[]> {
        try {
            const response = await api.get('/restaurants/search', { params: { q: query } });
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to search restaurants', error);
            return [];
        }
    },

    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached || null;
        }
        try {
            const response = await api.get(`/restaurants/${id}`);
            const restaurant = response.data?.data || null;
            if (restaurant) await cache.set(`restaurant_${id}`, restaurant);
            return restaurant;
        } catch (error) {
            log.error(`Failed to fetch restaurant ${id}`, error);
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached || null;
        }
    },

    async getMenu(restaurantId: string): Promise<Dish[]> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return cached || [];
        }
        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu`);
            const menuData = response.data?.data.length ? response.data?.data : [];
            const dishes = menuData.reduce((acc: Dish[], category: any) => {
                if (category.items && Array.isArray(category.items)) {
                    acc.push(...category.items);
                }
                return acc;
            }, []);
            await cache.set(`menu_${restaurantId}`, dishes);
            return dishes;
        } catch (error) {
            log.error(`Failed to fetch menu for restaurant ${restaurantId}`, error);
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return cached || [];
        }
    },

    async getCategories(): Promise<any[]> {
        try {
            const response = await api.get('/categories');
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to fetch categories', error);
            return [];
        }
    },
};

// ─────────────────────────────────────────────
// User API
// ─────────────────────────────────────────────
export const userAPI = {

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            await storage.setItem(STORAGE_KEYS.USER, user);
            await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            log.info('User logged in successfully');
            return { user, token };
        } catch (error) {
            log.error('Login failed', error);
            throw error;
        }
    },

    async getCurrentUser(): Promise<User | null> {
        return await storage.getItem(STORAGE_KEYS.USER);
    },

    async getProfile(): Promise<User | null> {
        try {
            const response = await api.get('/users/profile');
            const user = response.data?.data ?? null;
            if (user) await storage.setItem(STORAGE_KEYS.USER, user);
            return user;
        } catch {
            return storage.getItem<User>(STORAGE_KEYS.USER);
        }
    },

    async toggleFavorite(restaurantId: string): Promise<void> {
        const favResponse = await api.get('/favorites');
        const favorites = favResponse.data?.data ?? [];
        const isFav = favorites.some(
            (f: any) => f.restaurantId === restaurantId || f.id === restaurantId
        );
        if (isFav) {
            await api.delete(`/favorites/${restaurantId}`);
        } else {
            await api.post('/favorites', { restaurantId });
        }
    },

    async updateProfile(updates: Partial<User>): Promise<User> {
        try {
            const response = await api.put('/users/profile', updates);
            const user = response.data?.data || response.data;
            await storage.setItem(STORAGE_KEYS.USER, user);
            return user;
        } catch (error) {
            log.error('Failed to update profile', error);
            throw error;
        }
    },

    async logout(): Promise<void> {
        await storage.removeItem(STORAGE_KEYS.USER);
        await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await cache.clearAll();
        log.info('User logged out, cache cleared');
    },
};

// ─────────────────────────────────────────────
// Order API
// ─────────────────────────────────────────────
export const orderAPI = {

    async getOrders(): Promise<Order[]> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : [];
        }
        try {
            const response = await api.get('/orders');
            const orders = response.data?.data || response.data || [];
            await cache.set('orders', orders);
            return orders;
        } catch (error) {
            log.error('Failed to fetch orders', error);
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : [];
        }
    },

    async getOrderById(id: string): Promise<Order | null> {
        const isConnected = await checkConnection();
        if (!isConnected) {
            const cached = await cache.get<Order>(`order_${id}`);
            return cached || null;
        }
        try {
            const response = await api.get(`/orders/${id}`);
            const order = response.data?.data || response.data || null;
            if (order) await cache.set(`order_${id}`, order);
            return order;
        } catch (error) {
            log.error(`Failed to fetch order ${id}`, error);
            return (await cache.get<Order>(`order_${id}`)) || null;
        }
    },

    async createOrder(payload: {
        restaurantId: string;
        items: { menuItemId: string; quantity: number }[];
        deliveryAddress: Record<string, any>;
        paymentMethod: string;
        promoCode?: string;
    }): Promise<any> {
        const response = await api.post('/orders', payload);
        return response.data?.data ?? response.data;
    },

    async cancelOrder(id: string): Promise<void> {
        await api.post(`/orders/${id}/cancel`);
    },

    async syncOfflineOrders(): Promise<void> {
        const offlineOrders = await storage.getItem<any[]>(STORAGE_KEYS.OFFLINE_ORDERS);
        if (!offlineOrders?.length) return;
        await api.post('/sync/orders', { offlineOrders });
        await storage.removeItem(STORAGE_KEYS.OFFLINE_ORDERS);
    },

    async trackOrder(id: string): Promise<any | null> {
        try {
            const response = await api.get(`/orders/${id}/track`);
            return response.data?.data ?? null;
        } catch {
            return null;
        }
    },
};

// ─────────────────────────────────────────────
// Upload API
// ─────────────────────────────────────────────
export const uploadAPI = {

    async uploadImage(uri: string, type: 'profile' | 'review'): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri,
                name: `${type}_${Date.now()}.jpg`,
                type: 'image/jpeg',
            } as any);
            const response = await api.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data?.url || response.data?.data?.url;
        } catch (error) {
            log.error('Failed to upload image', error);
            throw error;
        }
    },
};

// ─────────────────────────────────────────────
// Promo API
// ─────────────────────────────────────────────
export const promoAPI = {

    async getAvailablePromos(): Promise<Promo[]> {
        try {
            const response = await api.get('/promos/available');
            return response.data?.data || [];
        } catch (error) {
            log.error('Failed to fetch promos', error);
            return [];
        }
    },

    async validatePromo(code: string, orderTotal: number): Promise<{ valid: boolean; promo?: Promo; message?: string }> {
        try {
            const response = await api.post('/promos/validate', { code, orderTotal });
            const data = response.data?.data ?? response.data;

            // backend returns discount amount in message field e.g. "-15.00€"
            const msg = data.message ?? '';
            const isDiscountAmount = /^-?\d+(\.\d+)?€?$/.test(msg.replace(/\s/g, ''));

            if (isDiscountAmount) {
                const amount = parseFloat(msg.replace('€', '').replace('-', '').trim());
                return {
                    valid: true,
                    promo: {
                        id: code,
                        code,
                        description: `Réduction de ${amount.toFixed(2)} €`,
                        discount: amount,
                        type: 'fixed',
                        isActive: true,
                    } as Promo,
                };
            }

            return {
                valid: data.valid ?? false,
                promo: data.promo,
                message: data.message,
            };
        } catch (error: any) {
            const msg = error.response?.data?.data?.message
                ?? error.response?.data?.message
                ?? 'Code invalide';
            return { valid: false, message: msg };
        }
    },
};

export default api;