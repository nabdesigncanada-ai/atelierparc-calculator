# AtelierParc Calculator — Shopify Private App

## Installation en 4 étapes

### ÉTAPE 1 — Héberger sur Render.com (gratuit)

1. Allez sur **render.com** → Sign up (gratuit)
2. **New** → **Web Service**
3. Connectez votre GitHub OU uploadez les fichiers
4. Nom : `atelierparc-calculator`
5. Runtime : **Node**
6. Build Command : `npm install`
7. Start Command : `npm start`
8. Cliquez **Create Web Service**
9. Render vous donne une URL : `https://atelierparc-calculator.onrender.com`

### ÉTAPE 2 — Configurer vos clés API

Ouvrez `server.js` et remplacez :
```
API_KEY: 'VOTRE_NOUVEAU_CLIENT_ID',
API_SECRET: 'VOTRE_NOUVEAU_SECRET',
```
Par vos nouvelles clés Shopify Partner (après Rotate API secret)

### ÉTAPE 3 — Configurer dans Shopify Partner Dashboard

1. partners.shopify.com → votre app
2. **App setup** → URLs :
   - App URL : `https://atelierparc-calculator.onrender.com`
   - Allowed redirection URLs : `https://atelierparc-calculator.onrender.com/auth/callback`
3. Sauvegardez

### ÉTAPE 4 — Installer sur votre boutique

1. Visitez : `https://atelierparc-calculator.onrender.com/install`
2. Cliquez **Installer**
3. Autorisez l'app dans Shopify
4. ✅ Le calculateur apparaît automatiquement sur vos pages produit !

## Résultat

Le calculateur s'injecte automatiquement sous le bouton Add to Cart sur toutes vos pages produit. Il détecte la langue (EN/FR) automatiquement.

## Support

nabdesigncanada@gmail.com
atelierparc.shop
