# AD&D 2nd Edition Character Manager

A web app for running AD&D 2nd Edition games: character creation, character sheets, inventory, spells, level-up, campaign journal, bestiary, monsters and a tactical battle map. Players and the DM sync live through Firebase.

Works in any modern browser on **desktop, tablet and mobile phone**.

## Play online

Once GitHub Pages is enabled, the app is available at:

`https://<your-github-username>.github.io/<repository-name>/`

On a phone you can add it to the home screen (Safari: Share → *Add to Home Screen*; Chrome: ⋮ → *Add to Home screen*) so it opens like an app.

## Run locally

Open `login.html` in a browser, or serve the folder with any static web server, for example:

```
python -m http.server 8000
```

then go to http://localhost:8000.

## Project structure

| Path | Contents |
|------|----------|
| `*.html` | One page per view (login, dashboard, sheet, inventory, spells, tactical map, …) |
| `css/style.css` | Theme and the mobile/touch layout rules |
| `js/` | App logic (`core.js` = Firebase + storage, `db.js` = rules data, one file per view) |
| `images/` | Monster artwork |

## Tech

Plain HTML/CSS/JavaScript, Tailwind CSS (CDN), Font Awesome, Firebase Realtime Database. No build step.
