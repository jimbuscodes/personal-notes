# Personal Notes

An Expo and React Native notes application with Firebase Authentication and
user-scoped Cloud Firestore storage.

## Features

- Email/password account creation and sign-in
- Sign out
- Create notes with a title and content
- View the full note in a modal
- Edit and delete notes
- Mark notes as favorites
- Filter between all notes and favorite notes
- Display the total number of notes
- Display each note's creation date
- Live synchronization with Cloud Firestore
- Firestore rules that restrict notes to their authenticated owner

## Tech stack

- Expo SDK 58
- React Native
- Expo Router
- TypeScript
- Firebase Authentication
- Cloud Firestore

## Requirements

- Node.js
- An Expo-compatible device, simulator, or web browser
- A Firebase project with:
  - Email/password Authentication enabled
  - Cloud Firestore enabled

The application is currently configured for the Firebase project
`webdev-class-setup`.

## Install and run

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

Run on the web:

```bash
npm run web
```

Run on Android or iOS:

```bash
npm run android
npm run ios
```

## Firebase setup

1. Open the `webdev-class-setup` project in the
   [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Cloud Firestore** database.
4. Publish the rules from [firestore.rules](./firestore.rules) in the
   Firestore **Rules** tab.

The Firebase project configuration is initialized in
[src/app/index.tsx](./src/app/index.tsx). Firebase web API keys are intended
to be used in client applications, while access control is enforced by
Authentication and Firestore Security Rules.

### Deploy Firestore rules with the CLI

The repository includes [.firebaserc](./.firebaserc) and
[firebase.json](./firebase.json), so the rules can also be deployed with:

```bash
npm install --global firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Firestore data model

Notes are stored in the `notes` collection. Each document contains:

```text
title      string
content    string
favorite   boolean
userId     string
createdAt  timestamp
```

Every read is filtered by the authenticated user's UID. The rules also verify
ownership for reads, creates, updates, and deletes.

## Validation

Run the TypeScript check:

```bash
npx tsc --noEmit
```

Build the web export:

```bash
npx expo export --platform web
```