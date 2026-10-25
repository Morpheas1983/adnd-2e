# AD&D 2nd Edition Character Manager

A web app for running AD&D 2nd Edition games: character creation, character sheets, inventory, spells, level-up, campaign journal, bestiary, monsters and a tactical battle map.

Works in any modern browser on **desktop, tablet and mobile phone**, with no server of its own. It is hosted on GitHub Pages and uses Google Firebase for accounts and data.

## Features

- **Real accounts**: register with email and password, or sign in with Google. Password reset by email.
- **Campaigns with invites**: whoever creates a campaign is its DM. Players join with an invite link or a 6-letter code.
- **Live sync**: changes appear on every device in real time, including the DM's screen during a session.
- **Permissions enforced by Firebase**: players can edit only their own characters, the DM can edit everything in their campaign, and DM notes are hidden from players.
- **Works offline**: the app keeps working on a bad connection and syncs when it's back.
- **Admin**: the admin account can see all users and campaigns.

## Play online

`https://morpheas1983.github.io/adnd-2e/`

On a phone, add it to the home screen (Safari: Share → *Add to Home Screen*; Chrome: ⋮ → *Add to Home screen*).

## One-time Firebase setup

In the [Firebase console](https://console.firebase.google.com/), open the project **adnd-e2**:

1. **Authentication → Get started → Sign-in method**: enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains → Add domain**: `morpheas1983.github.io`
3. **Firestore Database → Create database**: choose *production mode* and a European location.
4. **Firestore Database → Rules**: replace everything with the contents of [`firestore.rules`](firestore.rules), then **Publish**.

The admin email is set in two places: `ADMIN_EMAILS` in `js/core.js` and `isAdmin()` in `firestore.rules`. Change both to change the admin.

## Data model (Cloud Firestore)

| Path | Contents |
|------|----------|
| `users/{uid}` | Profile (name, email, last sign-in) |
| `campaigns/{id}` | Name, owner, members and roles, invite code, story, session log, party notes, personal notes |
| `campaigns/{id}/private/dm` | DM secret notes (DM only) |
| `campaigns/{id}/state/shared` | Creatures and custom spells |
| `campaigns/{id}/state/map` | Tactical map and saved maps |
| `characters/{id}` | Character (owner, campaign, data) |
| `invites/{code}` | Invite code → campaign |

## Importing old data

Use **Import** on the dashboard to bring in data from the old version of the app. It can read data saved in the browser you used before, an Export file, or an old online campaign by name.

## Project structure

| Path | Contents |
|------|----------|
| `*.html` | One page per view |
| `css/style.css` | Theme and mobile/touch layout |
| `js/core.js` | Firebase: sign-in, sync, campaigns, invites |
| `js/importer.js` | Export and import |
| `js/db.js` | AD&D rules data |
| `js/*.js` | One file per view |
| `firestore.rules` | Database security rules |

## Run locally

Serve the folder with any static web server (for example `python -m http.server 8000`) and open http://localhost:8000. Sign-in also works on `localhost`.
