# GRE Word Drill

Free GRE vocabulary practice. 4,660 GRE words in 156 sets of 30, ordered so the words most typical of the GRE come first. For each set, prepare with flashcards, then take a 4-option quiz. Each set has its own rankings (best accuracy wins, faster time breaks ties), plus an overall ranking by average accuracy.

- Sign in with Google (Firebase Authentication)
- Shared rankings and player-added words (Cloud Firestore)
- Plain HTML/CSS/JS, no build step, hosted on GitHub Pages

Definitions come from [Open English WordNet](https://en-word.net/) (CC BY 4.0).

## Setup (about 10 minutes)

### 1. Create the Firebase project
1. Go to https://console.firebase.google.com and click **Create a project** (Google Analytics is optional).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**, pick a support email, **Save**.
3. **Build → Firestore Database → Create database** → pick a location near your users (e.g. `asia-south1`) → start in **production mode**.
4. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules`, and click **Publish**.
5. **Project settings (gear icon) → General → Your apps → Web (`</>`)**, register an app (no hosting needed), and copy the `firebaseConfig` values into `firebase-config.js`.

### 2. Put it on GitHub Pages
1. Create a new **public** repository on GitHub, e.g. `gre-word-drill`.
2. Upload every file in this folder (drag them onto the repo's **Add file → Upload files** page) and commit.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root → Save.**
4. After a minute the site is live at `https://<your-username>.github.io/gre-word-drill/`.

### 3. Allow Google sign-in on that domain
Firebase console → **Authentication → Settings → Authorized domains → Add domain** → `<your-username>.github.io`.

Done. Share the link; each friend signs in with their own Google account.

## Running locally
Any static server works, e.g. `python3 -m http.server` in this folder, then open http://localhost:8000 (`localhost` is authorized in Firebase by default). Without a filled-in `firebase-config.js` the site runs in practice mode.

## Notes
- Scores are computed in the browser, so a determined player could edit their own row. Fine for friends; not for prizes.
- The Firebase free (Spark) plan easily covers a group of friends.
