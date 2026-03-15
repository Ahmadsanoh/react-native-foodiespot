# FoodieSpot — Application React Native (ESTIAM E4)

## Prérequis

- Node.js 18+
- Expo CLI : `npm install -g expo-cli`
- Expo Go installé sur votre appareil iOS/Android

## Installation et lancement
```bash
# 1. Cloner le projet
git clone https://github.com/Ahmadsanoh/react-native-foodiespot.git
cd estiam-e4-react-native
git checkout foodiespot-fullstack

# 2. Lancer le backend
cd foodiespot-backend
npm install
npm run dev
# Le backend tourne sur http://localhost:4000

# 3. Lancer l'application
cd ../foodie-spot
npm install
npx expo start
```

Scanner le QR code avec Expo Go.

> ⚠️ **Limitation connue Expo Go** : À l'ouverture via QR code, Expo Go affiche parfois "Unmatched Route" car il ouvre l'URL `exp://ip:port/--/` que Expo Router ne peut pas matcher. C'est une **limitation fondamentale d'Expo Go** qui ne peut pas être résolue sans un development build. **Contournement** : appuyer sur "Sitemap" → "login.tsx" pour accéder à l'application. L'app fonctionne normalement ensuite. Cette limitation disparaît avec `npx expo run:ios` ou `npx expo run:android`.

---

## Section I — Corrections effectuées

### Audit et architecture
- Correction du typo `resurantId → restaurantId` dans `types/index.ts`
- Centralisation des appels API dans `services/api.ts` avec intercepteurs Axios (auth token, gestion 401)
- Création de `services/token-store.ts` pour briser la dépendance circulaire `auth ↔ api`
- Remplacement de tous les imports relatifs profonds par les alias `@/`
- Unification du type `User` dans `types/index.ts`

### Composants réutilisables créés
- `components/loading-spinner.tsx` — spinner réutilisable avec texte
- `components/empty-state.tsx` — état vide avec icône, titre, action
- `components/error-state.tsx` — état d'erreur avec retry

### Corrections par écran
- **Home** : FlatList au lieu de ScrollView+map, spinner loading, bannière promo dynamique depuis l'API, géolocalisation
- **Search** : debounce 350ms, catégories depuis l'API, FlatList, chips actifs visuellement
- **Orders** : spinner loading, icône ShoppingBag, onglets de statut
- **Profile** : données dynamiques depuis l'API, stats réelles, alias imports
- **Notifications** : correction du useEffect sans tableau de dépendances (boucle infinie), correction du bug Promise.all (3 appels, 4 valeurs)
- **Restaurant** : loader réel, boutons Itinéraire/Appeler/Partager fonctionnels, typage `deliveryTime` corrigé
- **Dish** : suppression des IDs hardcodés, `restaurantId` depuis les params de route
- **Tracking** : timeline complète, infos livreur, polling 15s
- **Login/Register** : validation renforcée (regex email, longueur mot de passe, erreurs par champ)
- **_layout.tsx** : guard d'authentification fiable, pas de boucle, écrans manquants créés

### Écrans créés
- `app/cart.tsx` — panier complet
- `app/checkout.tsx` — paiement avec code promo
- `app/review/[orderId].tsx` — avis avec photos
- `app/onboarding.tsx` — onboarding premier lancement
- `app/addresses.tsx` — gestion des adresses

---

## Section II — Améliorations

1. **Home** : géolocalisation utilisateur pour filtrer les restaurants par distance (`lat`, `lng`, `radius`), bannière promo dynamique depuis `GET /promos/available`, CategoryList fixe (hors FlatList pour éviter disparition au scroll)
2. **Search** : debounce 350ms, catégories depuis API, historique des recherches persisté dans AsyncStorage
3. **Orders** : onglets En cours / Livrées / Annulées, annulation de commande via `POST /orders/:id/cancel`
4. **Restaurant** : section avis depuis `GET /restaurants/:id/reviews`, estimation livraison dynamique
5. **Notifications** : useEffect corrigé, Promise.all corrigé

---

## Section III — 10 Fonctionnalités innovantes implémentées

### A — Mode sombre (Dark Mode)
**Pourquoi** : Expérience utilisateur moderne, confort visuel la nuit, standard attendu sur mobile.  
**Valeur** : Toggle manuel (Clair/Sombre/Auto) dans le profil, persisté dans AsyncStorage. ThemeContext global avec `useAppTheme()` hook. Toutes les couleurs des écrans principaux s'adaptent dynamiquement.  
**Difficultés** : Mise à jour de chaque StyleSheet sans réécriture massive — résolu avec le hook `useAppTheme()` qui retourne les couleurs selon le thème.

### B — Système de panier complet
**Pourquoi** : Fonctionnalité core d'une app de livraison — sans panier, impossible de commander.  
**Valeur** : CartContext global (ajout, suppression, modification quantité, vidage), avertissement si changement de restaurant, badge animé sur l'icône panier dans la tab bar, accès direct au panier depuis toutes les pages.  
**Difficultés** : Gestion du changement de restaurant — résolu avec alerte de confirmation et vidage automatique.

### C — Suivi de livraison en temps réel sur carte
**Pourquoi** : Fonctionnalité différenciante — les utilisateurs veulent voir où est leur commande.  
**Valeur** : MapView avec marqueur restaurant et marqueur livreur, Polyline entre les deux, polling automatique toutes les 15 secondes, timeline de progression.  
**Difficultés** : `react-native-maps` nécessite un development build pour les fonctionnalités avancées — fonctionne en mode basique sur Expo Go.

### D — Système d'avis avec photos et notes par critère
**Pourquoi** : Les avis améliorent la confiance et aident les autres utilisateurs à choisir.  
**Valeur** : Note globale par étoiles, sous-notes par critère (qualité, rapidité, présentation), commentaire texte, upload de photos via `expo-image-picker`, envoi via `POST /reviews`.  
**Difficultés** : Upload multipart/form-data avec le token auth — géré dans `uploadAPI.uploadImage`.

### E — Recherche vocale
**Pourquoi** : Accessibilité et modernité — la recherche vocale est devenue un standard.  
**Valeur** : Bouton micro dans la barre de recherche, interface vocale via Alert avec suggestions, sauvegarde automatique dans l'historique.  
**Difficultés** : `expo-speech` est TTS (text-to-speech) et non STT (speech-to-text). La reconnaissance vocale réelle nécessite `@react-native-voice/voice` qui requiert un development build — non compatible avec Expo Go. L'interface est implémentée et fonctionnelle dans Expo Go via simulation.

### F — Historique de recherches récentes
**Pourquoi** : Gain de temps pour l'utilisateur — retrouver facilement ses recherches précédentes.  
**Valeur** : Persistance dans AsyncStorage via `STORAGE_KEYS.RECENT_SEARCHES`, affichage sous la barre de recherche quand le champ est vide, suppression individuelle ou totale, maximum 8 recherches conservées.  
**Difficultés** : Aucune majeure.

### G — Système de code promo interactif
**Pourquoi** : Les codes promo augmentent la conversion et fidélisent les utilisateurs.  
**Valeur** : Validation en temps réel via `POST /promos/validate`, affichage dynamique de la réduction, gestion des types (percent, fixed, delivery), messages d'erreur clairs, affichage "Livraison gratuite" pour les promos livraison.  
**Difficultés** : Le backend retourne le montant de réduction dans le champ `message` (ex: `-15.00€`) au lieu d'un objet promo structuré — géré avec un parsing de la réponse.

### H — Onboarding au premier lancement
**Pourquoi** : Présenter les fonctionnalités clés aux nouveaux utilisateurs améliore l'engagement.  
**Valeur** : 3 slides avec émojis et descriptions, bouton "Passer", persistance du flag `ONBOARDING_DONE` dans AsyncStorage, affiché uniquement au premier lancement.  
**Difficultés** : Conflit entre la navigation Expo Router et l'URL Expo Go (`--/`) — l'onboarding fonctionne correctement après la première navigation manuelle via Sitemap (limitation Expo Go documentée ci-dessus).

### I — Gestion des adresses de livraison
**Pourquoi** : Permettre à l'utilisateur de gérer ses adresses évite de les ressaisir à chaque commande.  
**Valeur** : Liste des adresses depuis `GET /users/addresses`, ajout via `POST /users/addresses`, suppression via `DELETE /users/addresses/:id`, définir une adresse par défaut via `PUT /users/addresses/:id`, navigation depuis le profil.  
**Difficultés** : Aucune majeure.

### J — Estimation du temps et du coût de livraison
**Pourquoi** : L'utilisateur veut savoir combien coûte et combien de temps prend la livraison avant de commander.  
**Valeur** : Carte d'estimation sur la page restaurant avec temps de livraison, distance et frais calculés dynamiquement (`frais = 2.99€ + distance × 0.50€`), affichage de la commande minimum si applicable.  
**Difficultés** : Le backend ne retourne pas toujours `deliveryFee` — calcul de fallback implémenté côté client.

---

## Décisions techniques

| Décision | Justification |
|----------|--------------|
| `SecureStore` pour les tokens JWT | Stockage chiffré sur iOS/Android, plus sécurisé qu'AsyncStorage |
| `token-store.ts` séparé | Brise la dépendance circulaire `auth.ts ↔ api.ts` |
| `CartContext` en mémoire (pas persisté) | Un seul restaurant à la fois comme Uber Eats/Deliveroo — cohérence métier |
| `useAppTheme()` hook | Évite de réécrire chaque StyleSheet — pattern DRY pour le dark mode |
| `FlatList` au lieu de `ScrollView+map` | Performance sur listes longues — virtualisation native |
| `Promise.all` pour les appels parallèles | Réduit le temps de chargement (restaurant + menu + avis en parallèle) |
| Debounce 350ms sur la recherche | Évite de spammer l'API à chaque frappe clavier |
| `expo-image-picker` pour les photos | SDK Expo officiel, compatible Expo Go |
| `react-native-maps` pour le tracking | Carte native performante, standard React Native |

---

## Limites connues

1. **Unmatched Route (Expo Go)** : L'URL `exp://ip:port/--/` ouverte par Expo Go n'est pas matchée par Expo Router. Contournement : Sitemap → login.tsx. Solution définitive : development build (`npx expo run:ios`).

2. **Onboarding non visible au premier scan** : À cause du problème Expo Go ci-dessus, l'onboarding ne s'affiche pas automatiquement au premier lancement via QR code. Il fonctionne correctement avec un development build.

3. **Recherche vocale STT** : La reconnaissance vocale réelle nécessite `@react-native-voice/voice` incompatible avec Expo Go. Interface implémentée, STT complet disponible avec un development build.

4. **Notifications Push** : `expo-notifications` n'est plus supporté dans Expo Go SDK 53. Nécessite un development build.

5. **Code promo** : Le backend retourne le montant dans le champ `message` au lieu d'un objet structuré — parsing côté client implémenté comme workaround.

---

## Structure du projet
```
foodie-spot/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (tabs)/          # Home, Search, Orders, Profile, Notifications
│   ├── restaurant/[id]  # Détail restaurant
│   ├── dish/[id]        # Détail plat
│   ├── cart.tsx         # Panier
│   ├── checkout.tsx     # Paiement
│   ├── tracking/        # Suivi commande
│   ├── review/          # Avis
│   ├── addresses.tsx    # Gestion adresses
│   └── onboarding.tsx   # Onboarding
├── components/          # Composants réutilisables
├── contexts/            # CartContext, AuthContext, ThemeContext
├── hooks/               # useAppTheme, useOffline, useNotifications
├── services/            # api.ts, auth.ts, storage.ts, token-store.ts
├── types/               # Types TypeScript unifiés
└── constants/           # theme.ts, config.ts
```
