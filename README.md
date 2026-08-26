# test-easy-call-js — demo Angular pour easy-call-js v2

Ce projet Angular 18 consomme `easy-call-js@2.0.0` en local et démontre
l'usage de la **nouvelle API événementielle** (v2) :

- `provideEasyCall(...)` pour bootstrap.
- `CallProcessAngular` injecté (avec `events$`, `state$`, `localStream$`, `remoteStreams$`).
- Directive `[ecVideo]="stream"` pour attacher un flux à un `<video>`.
- Flux `startCall`, `takeCall`, `releaseCall`, `rejectCall`, `trackIncomingCalls`.
- Un identifiant de test **généré automatiquement** (pas de nom à choisir) — voir [Identifiants de test](#identifiants-de-test) ci-dessous.

## Prérequis

1. Un projet Firebase (le signaling par défaut passe par Firestore).
2. Copier `src/app/firebase-config.example.ts` vers `src/app/firebase-config.local.ts`
   (déjà gitignored) et y remplir vos clés Firebase.
3. Node 18+, Angular CLI installé (`npm i -g @angular/cli`).
4. Déployer les règles Firestore du projet — voir [Sécuriser Firestore](#sécuriser-firestore) ci-dessous. Par défaut, un projet Firebase neuf refuse tout accès ; sans ces règles, `easy-call-js` ne pourra ni créer de room ni échanger le SDP.

## Installer & lancer

```bash
# Depuis test-easy-call-js/
npm install
npx ng serve --host 0.0.0.0 --port 4200 --ssl true
```

> `--ssl true` est requis en local pour que `getUserMedia` fonctionne
> sur d'autres appareils que localhost (WebRTC exige HTTPS).

## Tester un appel multipoint

À l'ouverture, chaque onglet atterrit sur le **lobby** avec un identifiant
déjà généré (ex. `swift-otter-42`), sans rien à saisir.

**Tout·e seul·e, sur plusieurs onglets :**

1. Ouvrez `https://<votre-ip>:4200/` dans 3 onglets. Chaque onglet obtient
   son propre identifiant (indépendant des autres — voir
   [Identifiants de test](#identifiants-de-test)).
2. Sur chaque onglet, notez l'identifiant affiché puis cliquez **Entrer
   dans le hub**.
3. Depuis le premier onglet, dans le champ *"Appeler qui ?"*, tapez les
   identifiants des deux autres, séparés par une virgule.
4. Cliquez **Démarrer l'appel**. Sur les deux autres onglets, un bandeau
   *"📞 Appel entrant"* apparaît — cliquez **Accepter**. Les trois
   participants voient les vidéos des deux autres dans la grille.

**À deux (ou plus), sur des appareils différents :**

1. Dans le lobby, cliquez **Copier le lien d'invitation** (ou **Copier
   l'identifiant**) et envoyez-le à la personne à appeler par le canal de
   votre choix (chat, SMS, etc.).
2. Chacun clique **Entrer dans le hub** sur son propre appareil.
3. L'un des deux tape l'identifiant de l'autre dans *"Appeler qui ?"* et
   clique **Démarrer l'appel** — le reste est identique.

## Flux couverts par la demo

| Action UI | Appel API v2 |
|---|---|
| Lobby : identifiant généré + entrée hub | `SessionIdentityService.id` → route `/hub/:userId` |
| **Démarrer l'appel** | `service.startCall(userId, targets)` |
| Bandeau **Appel entrant** (id de l'appelant) | `service.trackIncomingCalls(userId)` → `{ callId, from }` |
| **Accepter** | `service.takeCall(userId, callId, { joinTimeoutMs })` |
| **Refuser** | `service.rejectCall(userId)` |
| **Quitter l'appel** | `service.releaseCall(callId, userId)` |
| **Déconnexion** | `service.cleanup()` |
| Vidéo locale + vidéos distantes | `[ecVideo]` + `remoteStreams$` |
| Bandeaux info | `events$` (`ParticipantJoined/Left`, `CallEnded`, `Error`) |
| Pill d'état (idle/connecting/connected/...) | `state$` |

## Identifiants de test

Une fois en ligne, cette démo est ouverte à n'importe quel visiteur — pas
de connexion, pas de compte. Deux problèmes se posent alors :

1. **Collisions.** Si les gens choisissaient eux-mêmes leur identifiant
   (comme dans une version antérieure de cette démo), deux inconnus qui
   testent en même temps auraient de bonnes chances de taper le même nom.
   Comme `users/{userId}/call/callId` est une clé Firestore littérale sur
   cet id, ça collisionne : le bandeau "appel entrant" d'un inconnu
   pourrait sonner chez un autre inconnu.
2. **Coordination.** Pour tester à deux, il faut un moyen simple de
   communiquer "voici mon identifiant, appelle-moi".

`SessionIdentityService` (`src/app/identity/session-identity.service.ts`)
règle les deux : il génère un identifiant lisible (`adjectif-animal-nombre`,
ex. `swift-otter-42`) une seule fois par **onglet**, le garde dans
`sessionStorage`, et le lobby (`LobbyComponent`) l'affiche avec des
boutons **Copier l'identifiant** / **Copier le lien d'invitation** /
**Regénérer**.

- Personne n'a besoin d'inventer un nom → plus de collision entre
  inconnus (l'espace des identifiants est assez grand pour un usage démo).
- `sessionStorage` est isolé par onglet (contrairement à `localStorage`,
  partagé par tout le navigateur) : ouvrir 3 onglets donne 3 identifiants
  distincts, ce qui permet toujours de simuler un appel à plusieurs en
  solo — exactement comme avant, sans rien à taper.
- Le bouton **Copier le lien d'invitation** restaure un vrai test
  cross-device : deux personnes sur deux appareils différents peuvent
  s'appeler en se partageant simplement un lien, sans devoir se mettre
  d'accord sur un nom à l'avance.

Il n'y a plus de correspondance "id → nom affiché" hardcodée (ancien
`UserDirectory`) : les identifiants sont déjà lisibles et sont affichés
tels quels partout (en-tête, bandeaux, tuiles vidéo).

## Note technique — pourquoi `paths` dans `tsconfig.json` ?

`tsconfig.json` route les imports `easy-call-js` et `easy-call-js/angular`
directement vers les sources TypeScript de la lib locale. C'est nécessaire
tant que la lib n'est pas packagée avec `ng-packagr` — le compilateur
Angular (`ngc`) a alors besoin de la source pour générer les metadata
AOT des directives standalone.

Pour publier `easy-call-js` v2 sur npm, il faudra ajouter `ng-packagr` sur
le sous-package `angular/`. C'est un follow-up prévu, pas requis pour ce
projet de démo.

## Sécuriser Firestore

`firestore.rules` (à la racine) restreint chaque chemin écrit par
`FirebaseCallProcess` (rooms, verrou de join, SDP/ICE, notifications de
départ, marqueur d'appel entrant) à `request.auth != null` — un projet
Firebase neuf refuse tout par défaut, donc sans ces règles rien ne
fonctionne, et il ne faut jamais les remplacer par `allow read, write: if
true;` pour "faire marcher" la démo.

⚠️ Cette démo ne passe pas par Firebase Authentication — le `userId`
(auto-généré, voir [Identifiants de test](#identifiants-de-test)) n'est
pas une identité vérifiée. Ces règles n'autorisent donc pas "seul le
détenteur de tel id peut agir en tant que lui" ; elles bloquent
uniquement l'accès anonyme depuis l'extérieur. Pour qu'elles aient un
effet : Firebase Console → Authentication → Sign-in method → activez
**Anonymous**, puis connectez le visiteur (`signInAnonymously(auth)`)
avant d'appeler une méthode `easy-call-js` — l'adapter ne le fait pas
pour vous. Pour une vraie appli, remplacez `signedIn()` par une
vérification `request.auth.uid == userId` une fois que vous avez de
vraies identités.

Déployer les règles (une fois `firebase-tools` installé — `npm i -g
firebase-tools` puis `firebase login`) :

```bash
npx firebase deploy --only firestore:rules
```

`firebase.json` est fourni. `.firebaserc` (quel projet Firebase cible
`firebase deploy`) est gitignored — créez le vôtre avec
`firebase use --add`, ou un fichier `.firebaserc` :
```json
{ "projects": { "default": "VOTRE_PROJET_FIREBASE" } }
```

## Utiliser ses propres serveurs STUN/TURN

Dans `src/app/app.config.ts`, décommentez le bloc `config` :

```ts
provideEasyCall({
  signaling: new FirebaseCallProcess(firebaseConfig),
  config: {
    rtc: {
      iceServers: [
        { urls: 'stun:stun.mycompany.com' },
        { urls: 'turn:turn.mycompany.com', username: 'u', credential: 'p' },
      ],
    },
  },
}),
```

Seul le champ `iceServers` est remplacé — `iceCandidatePoolSize`,
`bundlePolicy` et le reste (`media`, `timeouts`) restent aux défauts.
