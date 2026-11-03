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
au fil de publications.
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

## Fil de publications (F2)

Le fil utilise une `FlatList` et uniquement le SDK Parse : inclusion de l’auteur,
tri décroissant sur `createdAt` puis `objectId`, pages de dix avec `skip/limit`.
Chaque carte affiche titre, auteur, date en français, extrait, likes et commentaires.
Le défilement charge la suite et le glissement vers le bas recharge la première page.
Les doublons sont éliminés par identifiant ; une réponse antérieure à une
actualisation est ignorée. Une erreur conserve les éléments visibles et permet
de réessayer sans avancer la pagination.

Vérification locale : les données fournies ont retourné trois pages de 10, 10 et
5 publications via le SDK, avec auteurs, compteurs et ordre décroissant vérifiés.
Les scénarios simulés couvrent aussi erreurs, nouvelle tentative, fin de liste,
actualisation concurrente et démontage. Le rendu et les gestes sur appareil
restent à vérifier. Les actions J’aime seront ajoutées dans F6.

## Détail d’une publication (F3)

Une carte du fil ouvre la route `/posts/[postId]` avec uniquement son identifiant.
L’écran charge la publication complète et ses commentaires depuis Parse,
avec les auteurs inclus. Les commentaires sont triés par date croissante,
puis par identifiant, et affichés dans une `FlatList`. La lecture se fait par lots
de 100 afin de ne pas tronquer la liste à la limite par défaut du SDK.

Le chargement, les erreurs avec nouvelle tentative, l’absence de commentaires
et une publication introuvable ou inaccessible sont traités. Le bouton natif
de retour permet de retrouver le fil et sa position.

TypeScript, lint et scénarios simulés vérifiés : chargement, erreur et nouvelle
tentative, prévention des doubles requêtes, publication introuvable, démontage
et lecture complète de 205 commentaires. Le test direct de F3 contre le serveur
et la vérification sur appareil restent à effectuer.
L’ajout de commentaires sera ajouté dans F5.

## Créer et supprimer une publication (F4)

Les utilisateurs connectés accèdent au formulaire depuis l’onglet « Publier ».
La route `/publish` renvoie les visiteurs vers la connexion.
L’ancienne route `/posts/new` redirige vers ce même écran.
Le formulaire réutilise `FormField` et `useValidatedForm` avec un schéma Yup :
titre de 3 à 120 caractères et contenu de 1 à 5 000 caractères après `trim()`.
Les champs sont désactivés pendant la soumission et les erreurs sont affichées.
Le client transmet uniquement le titre et le contenu ; auteur, compteurs et ACL
sont attribués par le serveur fourni.

Dans le détail, seul l’auteur voit « Supprimer ma publication ».
Un `Alert` natif demande confirmation avant `destroy()` ; le serveur conserve
le contrôle des droits et supprime les commentaires et likes associés.
Après une mutation réussie, retour au fil et rechargement de sa première page.
Un retour depuis un détail non modifié conserve la liste et sa position.

Vérifications simulées : limites de validation, nettoyage des espaces, soumission
unique, refus local des visiteurs, champs envoyés, confirmation et annulation,
visibilité réservée à l’auteur, erreurs, navigation et invalidation du fil.
La création/suppression réelle et le dialogue natif restent à vérifier sur appareil.

## Navigation principale

Les routes `/feed` et `/publish` sont regroupées dans un navigateur à deux onglets :
« Fil » et « Publier », avec icônes et couleurs adaptées au thème.
Le fil reste accessible sans compte. Toucher « Publier » en tant que visiteur
ouvre la connexion. La déconnexion reste dans la barre supérieure du fil.
Le détail d’une publication s’ouvre au-dessus des onglets avec un retour natif.

Le changement d’onglet conserve le brouillon. Publier avec succès ou annuler
vide le formulaire et revient au fil ; la création recharge sa première page.
La barre inférieure est masquée pendant la saisie au clavier.

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
