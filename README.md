# PKSahu.com — GitHub Pages + Firebase

A free, static personal site: **GitHub Pages** hosts the HTML/CSS/JS, and
**Firebase** (free Spark plan) handles everything dynamic — admin login,
weekly text vlogs, resume, and profile photo. No server to run or pay for.

```
index.html         Home page (dynamic profile photo + resume link)
vlogs.html         Weekly text vlog feed (reads from Firestore)
freelance.html     Freelance/services page
admin.html         Admin login + dashboard
js/firebase-init.js  Your Firebase config — YOU EDIT THIS
js/site-public.js    Loads photo/resume for public pages
js/vlogs.js           Loads vlog posts for vlogs.html
js/admin.js           Admin auth + dashboard logic
js/main.js            Mobile nav toggle
css/style.css
assets/hero.jpeg     Default photo (shown until admin uploads one)
firestore.rules       Firestore security rules
storage.rules         Storage security rules
```

---

## Part 1 — Put this on GitHub

1. Go to https://github.com/new → create a new repository (e.g. `pksahu-site`).
   Public or private both work with GitHub Pages, but **public repos get
   free Pages hosting on any plan**; private repos need GitHub Pro/Team/Enterprise.
2. On your computer, inside this folder:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pksahu-site.git
   git push -u origin main
   ```

## Part 2 — Turn on GitHub Pages

1. In your repo on GitHub: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: `main`, folder: **`/ (root)`** → **Save**.
4. Wait ~1 minute, then refresh — GitHub shows your live URL:
   `https://<your-username>.github.io/pksahu-site/`

## Part 3 — Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** (free).
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Authentication → Users → Add user** → enter your own email +
   a password. This is your **one admin account** — there's no public signup,
   so this is the only login that will ever work on `/admin.html`.
4. **Build → Firestore Database → Create database** → start in **production
   mode** → pick any region close to you.
5. **Build → Storage → Get started** → default settings are fine.
6. Publish the security rules (already written for you in this repo):
   - Firestore → **Rules** tab → paste in the contents of `firestore.rules` → **Publish**.
   - Storage → **Rules** tab → paste in the contents of `storage.rules` → **Publish**.
   - These let anyone **read** your public content, but only your logged-in
     admin account can **write** (post vlogs, upload resume/photo).
7. **Project settings (gear icon) → General → Your apps → Add app → Web (`</>`)**
   → register the app (nickname doesn't matter) → copy the `firebaseConfig`
   object it shows you.

## Part 4 — Connect the site to your Firebase project

1. Open `js/firebase-init.js` in this repo.
2. Replace the placeholder values with the real ones from your `firebaseConfig`.
3. Commit and push:
   ```
   git add js/firebase-init.js
   git commit -m "Add Firebase config"
   git push
   ```
4. Your GitHub Pages URL will pick up the change automatically within a minute.

## Part 5 — Log in and add content

Go to `https://<your-username>.github.io/pksahu-site/admin.html`, log in with
the email/password you created in Part 3.3, and you can:
- Write, edit, or delete weekly **text vlog posts** — they appear on `/vlogs.html`.
- **Upload your resume** — the Home page's "Download Resume" button updates automatically.
- **Upload a profile photo** — replaces the photo on the Home page automatically.

## Part 6 — Point your own domain at it

Say your domain is `pksahu.com`.

**A) At your domain registrar (GoDaddy, Namecheap, Google Domains, etc.)**,
add these DNS records:

- For the root domain (`pksahu.com`), add **four A records** pointing to GitHub Pages' IPs:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```
- For the `www` subdomain, add a **CNAME record**:
  ```
  www.pksahu.com  →  <your-username>.github.io
  ```
  (Only set up the ones you actually plan to use — root domain, www, or both.)

**B) Back in GitHub**, repo → **Settings → Pages → Custom domain** → type
`pksahu.com` (or `www.pksahu.com`) → **Save**. GitHub will:
- Add a `CNAME` file to your repo automatically with that domain in it.
- Show a green checkmark once DNS propagates (can take a few minutes to a few hours).
- Once it's verified, tick **Enforce HTTPS** so the site loads securely.

That's it — your domain now serves this GitHub Pages site, which talks to
Firebase directly from the browser for the admin login, vlogs, resume, and photo.

## Troubleshooting

- **"Missing or insufficient permissions" in the browser console** — you
  forgot to publish `firestore.rules` / `storage.rules`, or you're not logged
  in on `/admin.html` when trying to save.
- **Admin login says "Invalid email or password"** — double check the user
  exists under Authentication → Users, and Email/Password sign-in is enabled.
- **Custom domain shows a GitHub 404 or doesn't verify** — DNS changes can
  take time to propagate; re-check the records match exactly, then wait and
  refresh the Pages settings page.
