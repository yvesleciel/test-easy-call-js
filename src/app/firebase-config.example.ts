import type { FirebaseOptions } from 'firebase/app';

// Copy this file to `firebase-config.local.ts` (already gitignored) and fill
// in your own Firebase project's values — Console Firebase → Paramètres du
// projet → Vos applications → Configuration. `firebase-config.local.ts` is
// what app.config.ts actually imports; this file is only the template.
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  databaseURL: 'https://REPLACE_ME.firebaseio.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};
