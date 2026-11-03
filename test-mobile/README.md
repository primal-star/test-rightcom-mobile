# Blog mobile — Expo et Parse

Plateforme testée : **Android avec Expo Go**. Le 3 novembre 2026, l’utilisateur
a confirmé avoir testé les parcours sur son téléphone : connexion, publication,
suppression, commentaire et J’aime. Les contrôles de code et les vérifications
simulées sont distincts de cette validation sur appareil.

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
à la destination demandée (fil, création ou détail d’une publication).
Au lancement, tous les utilisateurs arrivent sur le fil, avec ou sans compte.
La barre supérieure affiche « Se connecter » pour un visiteur ou l’icône
de déconnexion pour un utilisateur connecté. La démonstration des primitives est retirée.

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
Les champs obligatoires sont identifiés automatiquement depuis les règles
`required()` du schéma Yup et affichent une étoile rouge après leur libellé.
Les champs facultatifs n’ont ni étoile ni mention supplémentaire.

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
actualisation concurrente et démontage. La validation sur Android est précisée
dans F7. Les actions J’aime sont disponibles dans F6.

## Détail d’une publication (F3)

Une carte du fil ouvre la route `/posts/[postId]` avec uniquement son identifiant.
L’écran charge la publication complète et ses commentaires depuis Parse,
avec les auteurs inclus. Les commentaires sont triés par date décroissante,
puis par identifiant, et affichés dans une `FlatList`. La lecture se fait par lots
de 100 afin de ne pas tronquer la liste à la limite par défaut du SDK.
L’ordre récent d’abord a été demandé pour cette version ; le sujet initial
indiquait un ordre ancien d’abord.

Le chargement, les erreurs avec nouvelle tentative, l’absence de commentaires
et une publication introuvable ou inaccessible sont traités. Le bouton natif
de retour permet de retrouver le fil et sa position.

TypeScript, lint et scénarios simulés vérifiés : chargement, erreur et nouvelle
tentative, prévention des doubles requêtes, publication introuvable, démontage
et lecture complète de 205 commentaires. La validation sur Android est précisée
dans F7.
L’ajout de commentaires est décrit dans F5 ci-dessous.

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
La validation des parcours sur Android est précisée dans F7.

## Navigation principale

Les routes `/feed` et `/publish` sont regroupées dans un navigateur à deux onglets :
« Fil » et « Publier », avec icônes et couleurs adaptées au thème.
Le fil reste accessible sans compte. Toucher « Publier » en tant que visiteur
ouvre la connexion puis le formulaire après authentification.
Les actions de connexion/déconnexion sont dans la barre supérieure, pas dans
le contenu du fil.
Le détail d’une publication s’ouvre au-dessus des onglets avec un retour natif.

Le changement d’onglet conserve le brouillon. Publier avec succès ou annuler
vide le formulaire et revient au fil ; la création recharge sa première page.
La barre inférieure est masquée pendant la saisie au clavier.

## Ajouter un commentaire (F5)

Le détail contient une zone de saisie fixe sous la liste, avec adaptation au
clavier et à la hauteur réelle de la barre de navigation.
Les visiteurs disposent d’un accès à la connexion ; seuls les utilisateurs
connectés peuvent envoyer un commentaire.

Le formulaire réutilise les wrappers Yup : texte de 1 à 500 caractères après
suppression des espaces aux extrémités. Une soumission en cours bloque les doubles
envois et les champs. Le client transmet uniquement le texte et le pointeur vers
la publication ; le serveur attribue l’auteur et met à jour le compteur.

Après confirmation de l’enregistrement, le commentaire est ajouté à la liste
locale du plus récent au plus ancien, le compteur du détail est incrémenté et le
champ est vidé. La liste défile vers le début des commentaires, sous la publication,
pour afficher le commentaire ajouté. Aucune nouvelle
lecture du détail n’est nécessaire. Le fil est invalidé pour actualiser son
compteur au retour sur l’onglet. En cas d’erreur, le brouillon est conservé.

Vérifications simulées : validation et limites, nettoyage, pointeur et champs
envoyés, passage par le gestionnaire de session, soumission unique, insertion
sans rechargement, absence de double comptage, ordre des commentaires, remise
à zéro après succès et conservation du brouillon en cas d’échec.
La validation des parcours sur Android est précisée dans F7.

## Mentions J’aime (F6)

Le bouton est disponible dans le fil et le détail. L’icône remplie et le libellé
« Aimé » indiquent une mention personnelle existante. Le bouton affiche une
attente et bloque les doubles pressions pendant la requête ; les données ne
changent qu’après confirmation du serveur.

La récupération d’une page interroge `Like` une seule fois pour l’utilisateur
courant et les publications de cette page, au moyen de `containedIn`.
Le détail effectue la même vérification pour sa publication.
Aucune requête `Like` n’est nécessaire pour un visiteur.

Toutes les mutations utilisent `Parse.Cloud.run("toggleLike", { postId })`.
Le compteur et l’état personnel sont mis à jour avec la réponse serveur.
Le client ne crée ni ne supprime directement un objet `Like`.
Une modification dans le détail invalide le fil, qui se synchronise au retour.
Une erreur conserve l’état précédent et est annoncée dans un toast.

Le fil et le détail sont publics. Publier, commenter et aimer exigent une connexion.
La suppression exige en plus d’être l’auteur. Un visiteur qui touche J’aime
voit une confirmation « Connexion requise » avec « Se connecter » et « Annuler ».
Seule la confirmation ouvre la connexion, puis revient à la page concernée,
sans rejouer automatiquement l’action initiale.

La destination est conservée lors du passage connexion/inscription et limitée
aux écrans internes autorisés. Sans destination valide, retour au fil.
« Continuer sans connexion » revient au détail public concerné ou au fil ;
une demande d’accès à Publier ne permet pas de contourner la connexion.

Vérifications simulées : lecture groupée des mentions personnelles, omission de
la requête pour les visiteurs, ajout/retrait, compteurs issus du serveur,
soumission unique, erreurs sans changement visuel des données, mise à jour
du fil et du détail et redirection vers la connexion. La validation des parcours
sur Android est précisée dans F7.

## Qualité de l’expérience (F7)

Les lectures gèrent le chargement, les listes vides, les erreurs et les nouvelles
tentatives. Une erreur de pagination ou d’actualisation conserve les publications
visibles. Les requêtes concurrentes d’actualisation sont bloquées et les réponses
périmées sont ignorées.

Les formulaires désactivent leurs champs et boutons pendant l’envoi. Un échec
conserve le brouillon. Les actions J’aime, suppression et déconnexion ont aussi
un état d’attente et une protection contre les appels répétés.
Les messages courants de réseau, délai, session expirée et compte déjà utilisé
sont présentés en français. Les erreurs inconnues utilisent un message général
adapté à l’action ; les réponses techniques brutes ne sont pas présentées.
Les identifiants incorrects affichent un message explicite.
Les erreurs disposent d’un rôle d’alerte et d’une annonce accessible.

Les erreurs API de connexion, inscription, publication, commentaire, J’aime
et suppression s’affichent en toast, sans doublon dans le formulaire.
Les erreurs de validation Yup restent sous le champ concerné.
Les erreurs de chargement du fil ou du détail conservent leur bloc avec
« Réessayer ». Chaque nouveau toast reste visible quatre secondes, même si
son texte est identique au précédent.

Lorsqu’une session expire sur une page publique, l’utilisateur est déconnecté
et un toast affiche « Votre session a expiré. Vous avez été déconnecté » pendant
quatre secondes. Il peut continuer à consulter la page en tant que visiteur.
L’incident est annoncé une seule fois même si plusieurs requêtes échouent ensemble,
et le message ne se répète pas dans les erreurs locales. L’écran protégé
« Publier » conserve son contrôle d’accès et le message de reconnexion.

### Validation

- Parcours nominaux : testés sur Android par l’utilisateur, confirmation du 3 novembre 2026.
- TypeScript : `npx tsc --noEmit`.
- Lint : `npx expo lint`.
- Vérifications simulées ponctuelles : session, accès public/authentifié, formulaires,
  pagination, erreurs/retry, concurrence, compteurs, J’aime et messages utilisateur.
- Assemblage JavaScript Android vérifié lors de la mise en place des onglets ;
  cela ne constitue pas une validation d’un APK de production.

Aucune validation iOS ni campagne exhaustive sur les tailles de police,
TalkBack, réseau dégradé et expirations de session n’est documentée.
Les nouvelles traductions et annonces accessibles de F7 ont été vérifiées
par contrôles de code/simulation ; leur rendu final sur téléphone reste à confirmer.

### Limites et améliorations

Le MUST est implémenté. Les bonus (édition, suppression de ses commentaires,
LiveQuery, J’aime optimiste et tests de composants) ne sont pas ajoutés.
Les vérifications simulées ponctuelles ne remplacent pas une suite de tests
versionnée ; une telle suite serait une prochaine amélioration.

Le serveur fourni est un environnement de développement : les données sont
réinitialisées au redémarrage sans base persistante configurée.
L’application ne propose pas de mode hors ligne ni de récupération de mot de passe.
Pour une suite au test : tests de composants et d’intégration reproductibles,
validation iOS et accessibilité, puis pagination des commentaires au défilement.
