# Mobile Test — Blog app · React Native + Parse JS SDK (Junior)

**Time limit: 3 hours, setup included.** Work in order: finish the **Must** items before any **Bonus**.
A smaller app that works is better than a big app that is broken.

## 1. What you get

A ready-to-run backend in `dev-server/` (do not modify it):

```bash
cd dev-server && npm install && npm start      # Node 20.19+
```

| Item | Value |
|---|---|
| Server URL | `http://<host>:1337/parse` — see the table below for `<host>` |
| App ID | `blog-app` (no JavaScript key needed) |
| Seed users | `alice`, `bob`, `carol` — password `Password123!` |
| Seed data | 25 posts with comments and likes (data resets on every restart) |

| You run the app on | `<host>` |
|---|---|
| iOS simulator / web | `localhost` |
| Android emulator | `10.0.2.2` |
| Physical device (Expo Go) | your computer's LAN IP (same Wi-Fi) |

## 2. Stack and rules

- **Expo** (latest SDK), JS or TS. React Navigation or Expo Router. Any UI library.
- Talk to the server **only** through the Parse JS SDK:

  ```bash
  npx expo install @react-native-async-storage/async-storage expo-crypto
  npm i parse
  ```

  The SDK calls `require('crypto')`, which React Native lacks. Add these two files at the project root (given, not graded):

  ```js
  // metro.config.js
  const { getDefaultConfig } = require('expo/metro-config');
  const config = getDefaultConfig(__dirname);
  config.resolver.extraNodeModules = { crypto: require.resolve('./crypto-shim.js') };
  module.exports = config;

  // crypto-shim.js
  const { randomUUID } = require('expo-crypto');
  module.exports = { randomUUID };
  ```

  ```js
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import Parse from 'parse/react-native.js';

  Parse.setAsyncStorage(AsyncStorage);
  Parse.initialize('blog-app');
  Parse.serverURL = 'http://<host>:1337/parse';
  ```

- No other backend, no master key in the app.
- Docs: https://docs.parseplatform.org/js/guide/ · https://docs.expo.dev/
- Generative AI: allowed / forbidden *(set by the recruiter)*.

## 3. Backend contract (already implemented)

| Class | Fields | Rules enforced by the server |
|---|---|---|
| `_User` | `username`, `password`, `email` | `email` is never returned to other users |
| `Post` | `title` (3–120 chars), `body` (1–5000 chars), `author` → `_User`, `likesCount`, `commentsCount` | Login required to create. `author`, counters and ACL set by the server. Only the author can edit/delete. Deleting a post deletes its comments and likes. |
| `Comment` | `post` → `Post`, `author` → `_User`, `text` (1–500 chars) | Login required to create. `author` set by the server. Only the author can delete. Updates `post.commentsCount`. |
| `Like` | `post` → `Post`, `user` → `_User` | Read-only for clients. Use the cloud function below. |

Cloud function: `Parse.Cloud.run('toggleLike', { postId })` → `{ liked: boolean, likesCount: number }` (login required).

Errors are `Parse.Error`: `142` validation, `101` not found / not allowed, `209` invalid session (log the user out).

## 4. Features

### Must (≈ 2h30)

| # | Feature | Acceptance criteria |
|---|---|---|
| F1 | **Auth** | Sign up, log in, log out. Session survives an app restart. Server errors shown to the user. |
| F2 | **Feed** | `FlatList`, newest first, 10 per page, **infinite scroll** + **pull-to-refresh**. Each item: title, author username, date, body excerpt, likes count, comments count. |
| F3 | **Post detail** | Tap a post → full post + comments oldest first (author, date, text). |
| F4 | **Write** | Logged-in users can create a post (validation matches server limits). The author can delete their own post (confirmation `Alert`). |
| F5 | **Comment** | Logged-in users add a comment; input stays visible above the keyboard; the comment appears without reloading the screen. Counts update. |
| F6 | **Like** | Like / unlike button on feed and detail. Shows whether **I** liked the post (hint: query `Like` for the current user and the displayed posts). Anonymous users are sent to login. |
| F7 | **UX basics** | Loading, empty and error states. Buttons disabled while a request runs. Works on at least one platform (state which one). |

### Bonus (only if Must is done)

- Edit own post, delete own comment.
- Real-time comments with LiveQuery (enabled on `Comment`).
- Optimistic like (instant UI, rollback on error).
- Component tests (Jest + React Native Testing Library), TypeScript.

## 5. Deliverable

A Git repository (link or zip including `.git`) with:

- `npm install && npx expo start` works against the dev server.
- `README.md`: how to run (platform tested, how to set `<host>`), what is done / not done, choices, what you'd improve.
- A short screen recording (≤ 2 min) is welcome.
- Small, meaningful commits. Only commits inside the 3h window are graded.

## 6. What we look at

Working features (≈ 50%), code quality and structure (≈ 25%), correct use of the Parse SDK (≈ 15%), mobile UX and README (≈ 10%).
A short debrief (15 min) follows: be ready to explain your code.
