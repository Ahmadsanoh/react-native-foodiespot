export interface Restaurant {
    id: string;
    name: string;
    slug?: string;
    cuisine: string | string[];
    description: string;
    image: string;
    coverImage?: string;
    rating: number;
    reviewCount: number;
    reviewsCount?: number;
    deliveryTime: { min: number; max: number } | number;
    deliveryFee?: number;
    minimumOrder?: number;  
    distance?: number;
    priceRange: string | number;
    address: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    isOpen: boolean;
    isFavorite?: boolean;
    features?: string[];
}

export interface SearchFilters {
    cuisine?: string;
    priceRange?: string;
    rating?: number;
    deliveryTime?: number;
    isOpen?: boolean;
    lat?: number;
    lng?: number;   
    radius?: number;
}
export interface Dish {
    id: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    allergens?: string[];
    isAvailable: boolean;
}


export interface CartItem {
    dish: Dish;
    quantity: number;
    options?: string[];
    specialInstructions?: string;
    name?: string;
    price?: number;
}

export interface User {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    photo?: string;
    addresses: Address[];
    favoriteRestaurants: string[];
}

export interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    postalCode: string;
    isDefault?: boolean;
    country: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}
export interface Order {
    id: string;
    restaurantId: string;
    restaurantName: string;
    items: CartItem[];
    total: number;
    deliveryFee: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'on-the-way' | 'delivered' | 'cancelled';
    createdAt: Date;
    estimatedDeliveryTime?: Date;
    deliveryAddress: string;
    driverInfo?:{
        name: string;
        phone: string;
        photo?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    };
}

export interface Promo {
    id: string;
    code: string;
    description: string;
    discount: number;
    type: 'percent' | 'fixed' | 'delivery';
    minOrder?: number;
    maxDiscount?: number;
    isActive: boolean;
    expiresAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  restaurantCount?: number;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export interface ToastOptions {
    type?: ToastType;
    duration?: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType { 
    show: (message: string,  type?: ToastType, duration?: number) => void;
    success: (message: string,  duration?: number) => void;
    error: (message: string,  duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string,  duration?: number) =>  void;
}


export interface ToastStackProps {
    toasts: ToastMessage[];
}

export interface ToastItemProps {
    toast: ToastMessage;
    index: number;
}
