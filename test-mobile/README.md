# Blog mobile — Expo et Parse

Plateforme testée : **Android avec Expo Go**

## Backend Parse local

Depuis le dossier parent, démarrer le serveur fourni :

```sh
cd dev-server
npm install
npm start
```

Dans `test-mobile`, installer les dépendances puis lancer Expo :

```sh
npm install
npx expo start
```

### Environnemnt

| Environnement | URL par défaut |
| --- | --- |
| Émulateur Android standard | `http://10.0.2.2:1337/parse` |
| Simulateur iOS / web | `http://localhost:1337/parse` |
| Téléphone physique | À configurer avec l’adresse IPv4 LAN de l’ordinateur |

Pour un téléphone, copier `.env.example` vers `.env`, puis définir :

```dotenv
EXPO_PUBLIC_PARSE_SERVER_URL=http://<votre-addresse-ip>:1337/parse
```

Remplacer l’adresse par celle de l’ordinateur. Le téléphone et l’ordinateur doivent
être sur le même réseau Wi-Fi et le port 1337 doit être accessible.
Recharger complètement l’application après une modification de cette variable.

### Limites et améliorations

Le MUST est implémenté. Les bonus (édition, suppression de ses commentaires,
LiveQuery, J’aime optimiste et tests de composants) ne sont pas ajoutés faute du délai de 3h imparti