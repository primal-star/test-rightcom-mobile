# Blog mobile — Expo et Parse

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

Le client partagé est exporté depuis `@/shared/lib/parse`.
Il initialise le SDK avec l’App ID `blog-app` et AsyncStorage pour le stockage
persistant utilisé par le SDK. Aucune JavaScript key ni master key n’est nécessaire.
Le `SessionProvider` restaure l’utilisateur local au démarrage via
`Parse.User.currentAsync()` et expose `useSession` depuis
`@/features/auth/hooks/useSession`. Les écrans attendent la restauration ; une erreur de
stockage est affichée avec une action pour réessayer.

Après une connexion ou une inscription via le SDK, appeler `refreshSession()`
pour synchroniser le contexte. `signOut()` déconnecte via le SDK et synchronise
l’état local, même si la révocation côté serveur échoue ; cette erreur est affichée.
Les requêtes authentifiées doivent passer par `withSession(() => requêteSDK())`
pour traiter le code Parse `209` et déconnecter une session devenue invalide.
Les autres erreurs sont propagées à l’appelant.
La restauration locale ne vérifie pas la validité du token auprès du serveur :
elle fonctionne sans réseau, puis les requêtes détectent une session expirée.
Les routes `/login` et `/signup` permettent la connexion et l’inscription via le SDK.
Le nom d’utilisateur et le mot de passe sont requis ; l’adresse e-mail est facultative
et doit être valide si elle est renseignée. Le mot de passe est transmis tel que saisi.
Les erreurs serveur sont affichées et les champs/actions sont désactivés pendant
la soumission. Après succès, la session est synchronisée et l’application revient
au fil de publications (écran d’attente tant que F2 n’est pas implémentée).
Au lancement, les visiteurs arrivent sur la connexion ; une session restaurée
ouvre directement le fil. La lecture sans connexion reste accessible depuis
le bouton « Continuer sans connexion ». La démonstration des primitives est retirée.

Pour vérifier F1 sur appareil : se connecter avec `alice` / `Password123!`,
fermer puis relancer l’application, vérifier la session, puis se déconnecter et
relancer. Vérifier également un mauvais mot de passe, un nom déjà utilisé,
une inscription valide et une panne réseau.

Les formulaires utilisent `useValidatedForm(schemaYup, valeursInitiales)` depuis
`@/shared/hooks/useValidatedForm`. `handleSubmit` valide avec Yup avant tout appel
au serveur, transmet les valeurs transformées par le schéma et bloque les doubles
soumissions. Les règles propres à l’authentification sont dans `auth.schemas.ts`.
`FormField` relie un champ nommé à sa valeur, son erreur et son état désactivé :
il n’est plus nécessaire de répéter ce branchement dans chaque écran.
La validation est déclenchée à la soumission ; modifier un champ efface son erreur.

Le style commun est porté par les primitives : boutons arrondis, champs sur fond
discret, bordure au focus ou en erreur, et affichage/masquage des mots de passe.
Les écrans d’authentification adaptent la référence fournie avec un titre centré
et des liens textuels, sans connexion sociale ni récupération de mot de passe.

| Environnement | URL par défaut |
| --- | --- |
| Émulateur Android standard | `http://10.0.2.2:1337/parse` |
| Simulateur iOS / web | `http://localhost:1337/parse` |
| Téléphone physique | À configurer avec l’adresse IPv4 LAN de l’ordinateur |

Pour un téléphone, copier `.env.example` vers `.env.local`, puis définir :

```dotenv
EXPO_PUBLIC_PARSE_SERVER_URL=http://192.168.1.100:1337/parse
```

Remplacer l’adresse par celle de l’ordinateur. Le téléphone et l’ordinateur doivent
être sur le même réseau Wi-Fi et le port 1337 doit être accessible.
Recharger complètement l’application après une modification de cette variable.
Les variables `EXPO_PUBLIC_*` sont intégrées au client : ne pas y placer de secret.

`metro.config.js` redirige le module Node `crypto` vers `crypto-shim.js`,
qui fournit `randomUUID` avec Expo Crypto, conformément au sujet.
Après l’ajout de cette configuration Metro, redémarrer Expo :

```sh
npx expo start --clear
```

## Documentation du projet initial

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
