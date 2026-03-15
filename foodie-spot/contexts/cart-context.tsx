import React, { createContext, useCallback, useContext, useState } from 'react';
import { Dish } from '@/types';

export interface CartItem {
    dish: Dish;
    quantity: number;
    restaurantId: string;
    restaurantName: string;
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    restaurantId: string | null;
    restaurantName: string | null;
    addItem: (dish: Dish, restaurantId: string, restaurantName: string) => void;
    removeItem: (dishId: string) => void;
    updateQuantity: (dishId: string, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const restaurantId = items.length > 0 ? items[0].restaurantId : null;
    const restaurantName = items.length > 0 ? items[0].restaurantName : null;
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);

    const addItem = useCallback((dish: Dish, restId: string, restName: string) => {
        setItems(prev => {
            // if cart has items from a different restaurant, clear first
            if (prev.length > 0 && prev[0].restaurantId !== restId) {
                return [{ dish, quantity: 1, restaurantId: restId, restaurantName: restName }];
            }
            const existing = prev.find(i => i.dish.id === dish.id);
            if (existing) {
                return prev.map(i =>
                    i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { dish, quantity: 1, restaurantId: restId, restaurantName: restName }];
        });
    }, []);

    const removeItem = useCallback((dishId: string) => {
        setItems(prev => prev.filter(i => i.dish.id !== dishId));
    }, []);

    const updateQuantity = useCallback((dishId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter(i => i.dish.id !== dishId));
        } else {
            setItems(prev => prev.map(i =>
                i.dish.id === dishId ? { ...i, quantity } : i
            ));
        }
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    return (
        <CartContext.Provider value={{
            items, totalItems, totalPrice,
            restaurantId, restaurantName,
            addItem, removeItem, updateQuantity, clearCart,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};