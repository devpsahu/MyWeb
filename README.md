# PKSahu.com

A personal site (Home, Freelance, Vlogs) with a small admin panel to
update vlog episodes and the downloadable resume — no database, no
build step, no external npm packages. The backend is plain Node.js.

## Run it

```
node server.js
```

Then open http://localhost:3000

That's it — no `npm install` needed. (If you'd rather use Express,
you can swap it in later; this version deliberately avoids
dependencies so it runs anywhere Node runs.)

## Folders

```
backend/
├── server.js          # the whole backend
├── setup-admin.js      # CLI to change the admin username/password
├── .env                 # admin credentials (hash, not plaintext) + port
├── data/
│   ├── vlogs.json       # vlog episodes — edited via the admin panel
│   └── resume.json      # metadata about the uploaded resume
├── uploads/              # the actual resume file lives here
└── public/               # the website itself (served as static files)
    ├── index.html
    ├── freelance.html
    ├── vlogs.html
    ├── admin.html
    ├── css/style.css
    └── js/
```

## Admin login

Go to `/admin.html`.

- Username: `pradyumna@sahuk`
- Password: `Go@pk.com`

The password is stored in `.env` as a salted hash — never in plain
text. **To change the username or password**, run:

```
node setup-admin.js yournewusername yournewpassword
```

then restart the server.

Sessions are kept in memory and expire after 8 hours, or on restart.
That's fine for a single-admin personal site; if this ever needs
multiple admins or to survive server restarts cleanly, swap the
in-memory session Map in `server.js` for a real store.

## What the admin panel does

- **Vlog manager** — add, edit, remove episodes (tag, title,
  description, date, duration, YouTube video ID). Saving writes to
  `data/vlogs.json`; the Vlogs page reads from there.
- **Resume upload** — uploads a PDF/DOC file, stored in `uploads/`.
  The "Download Resume" button on the homepage links to `/resume`,
  which always serves whatever was last uploaded.

## Deploying to your domain

GitHub itself only hosts static files (GitHub Pages) — it can't run a
Node process, so pushing this repo to GitHub is just the source-control
step. To actually run the backend and put it on your domain, you need a
host that keeps a Node process running. Render, Railway, and Fly.io all
have simple free/cheap tiers that work with this project as-is (start
command `node server.js`, no build step). A plain VPS with `pm2` +
`nginx` also works if you'd rather manage it yourself.

Rough steps for a Render/Railway-style host:

1. Push this repo to GitHub (`.env` is gitignored, so your credentials
   won't be committed — good).
2. Create a new "Web Service" on the host, pointing at your GitHub repo.
3. Set the start command to `node server.js`.
4. Add environment variables in the host's dashboard (not a committed
   file): `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (copy the value from
   your local `.env`), and `PORT` if the host requires you to set it
   explicitly (many set it for you automatically).
5. Once it's deployed and reachable at the host's given URL, add your
   domain in the host's "Custom Domain" settings, then add the DNS
   record it gives you (usually a `CNAME`, or an `A`/`ALIAS` record for
   a root domain) at wherever you manage your domain's DNS.
6. HTTPS is normally issued automatically once the domain resolves.

**One real caveat:** `data/vlogs.json`, `data/resume.json`, and the
`uploads/` folder are plain files on disk. Most free-tier PaaS hosts
use an *ephemeral* filesystem — anything written after deploy (a vlog
edit, a resume upload) can be wiped on the next deploy or restart. If
that matters to you, look for a host/plan with a **persistent
disk/volume** (Render and Railway both offer this on paid tiers, Fly.io
has volumes on its free allowance), or say the word and I can switch
the data storage to a small hosted database instead.

## Notes

- Vlog comments are still local to each visitor's browser
  (localStorage) — they were never wired to the backend, since you
  only asked for vlog + resume admin features. Say the word if you
  want shared, persisted comments too (needs a small database).
- `.env` and `uploads/` are listed in `.gitignore` — don't commit
  real credentials or your resume file to a public repo by mistake.
