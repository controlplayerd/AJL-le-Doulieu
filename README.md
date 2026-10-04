# Centre de Loisirs AJL

Site vitrine responsive du Centre de Loisirs AJL, avec présentation de l’équipe, informations pratiques, calendrier, menus, documents, galerie photo protégée par mot de passe, formulaire de contact et formulaire de candidature.

## Démarrage local

Prérequis : Node.js 20 ou supérieur et npm.

```bash
npm ci
npm start
```

Sous PowerShell, créer la configuration locale avec `Copy-Item .env.example .env` avant de démarrer. Le site est servi sur `http://localhost:3000` par défaut. Le port peut être modifié avec `PORT`.

Pour tester les formulaires, renseigner les variables SMTP dans `.env`. Avec Gmail, utiliser un mot de passe d’application. `MAIL_FROM` doit être une adresse autorisée par le fournisseur SMTP ; les messages sont envoyés à `MAIL_TO`.

## Mise en ligne

1. Choisir un hébergeur Node.js compatible avec Node 20 ou supérieur et configurer la commande de démarrage `npm start`.
2. Définir les variables d’environnement à partir de `.env.example` dans le tableau de bord de l’hébergeur, en passant `NODE_ENV` à `production`. Ne jamais publier ni transmettre le vrai fichier `.env`.
3. Exposer le site uniquement en HTTPS, derrière le proxy TLS de l’hébergeur. Le serveur utilise `PORT` fourni par l’hébergeur et ajoute des en-têtes de sécurité en production.
4. Monter un stockage **persistant** et inscriptible pour `DATA_DIR` et `PHOTO_DIR`. Ils contiennent les données du planning, de l’équipe, les messages et candidatures reçus, ainsi que les photos de la galerie. Sauvegarder ces deux emplacements régulièrement.
5. Configurer les identifiants SMTP, définir explicitement `MAIL_TO` et vérifier l’envoi réel des formulaires avant d’annoncer le site. Sans cette variable, le serveur utilise l’adresse de contact publique du centre.
6. Le point de contrôle de disponibilité est `GET /health`.

La galerie exige le mot de passe communiqué aux familles par un canal privé. Après authentification, son cookie est protégé (`HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS) et expire après huit heures. Les sessions de galerie sont conservées en mémoire : garder une seule instance du serveur, car un redémarrage invalide les sessions.

Le site ne comporte pas d’espace de connexion directeur ni de panneau d’administration. Sur un stockage neuf, le serveur crée une équipe vide et un menu/planning sans données en production : renseigner et vérifier les fichiers `animators.json` et `planning.json` dans `DATA_DIR` avant l’annonce du site. Les documents et photos se mettent à jour dans `public/` et `PHOTO_DIR` avant le déploiement.

## Données et confidentialité

Les formulaires enregistrent les coordonnées et les messages/candidatures dans `DATA_DIR`, en plus de tenter de les envoyer par e-mail. Avant publication, définir et communiquer les durées de conservation, limiter l’accès aux sauvegardes et ajouter les mentions légales ainsi que la politique de confidentialité requises. Vérifier également que les autorisations nécessaires à la diffusion des photos d’enfants ont été recueillies.

Les photos du dossier `PHOTO_DIR` sont supprimées automatiquement après sept jours. Les photos et données JSON ne doivent pas être placées dans `public/`.

## Vérifications avant publication

- `npm ci`
- `npm start`, puis vérifier `GET /health`
- Tester l’affichage sur téléphone et ordinateur
- Tester la galerie avec le mot de passe communiqué par le centre
- Tester les deux formulaires avec une configuration SMTP réelle
- Vérifier le certificat HTTPS, les mentions légales, la politique de confidentialité et la sauvegarde des données persistantes
