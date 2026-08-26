import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { FirebaseCallProcess } from 'easy-call-js';
import { provideEasyCall } from 'easy-call-js/angular';

import { routes } from './app.routes';
// Your real project config — gitignored, not in this repo. Copy
// firebase-config.example.ts to firebase-config.local.ts and fill in your
// own values (Console Firebase → Paramètres du projet → Vos applications →
// Configuration) before building.
import { firebaseConfig } from './firebase-config.local';

// firestore.rules gates every path behind `signedIn()` — this app never
// shows a login screen, so an anonymous Firebase Auth session is the
// cheapest way to satisfy that without inventing real accounts. It must
// resolve *before* any FirebaseCallProcess call runs, hence APP_INITIALIZER
// blocking bootstrap on it. `getApp()` (not `initializeApp()` again) reuses
// the app instance FirebaseCallProcess already created above.
// Requires "Anonymous" enabled under Firebase console → Authentication →
// Sign-in method — without it this rejects and every Firestore call below
// keeps failing with `permission-denied`.
function signInAnonymouslyOnBootstrap(): () => Promise<void> {
  return () =>
    signInAnonymously(getAuth(getApp())).then(
      () => undefined,
      err => {
        console.error(
          '[easy-call-js demo] Anonymous sign-in failed — enable "Anonymous" under ' +
          'Firebase console → Authentication → Sign-in method for this project. ' +
          'Every Firestore call will fail with permission-denied until then.',
          err,
        );
      },
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    { provide: APP_INITIALIZER, useFactory: signInAnonymouslyOnBootstrap, multi: true },

    provideEasyCall({
      signaling: new FirebaseCallProcess(firebaseConfig),
      // Décommentez pour utiliser vos propres serveurs STUN/TURN :
      // config: {
      //   rtc: {
      //     iceServers: [
      //       { urls: 'stun:stun.mycompany.com' },
      //       { urls: 'turn:turn.mycompany.com', username: 'u', credential: 'p' },
      //     ],
      //   },
      // },
    }),
  ],
};
