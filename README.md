# Friends of Denton Dene

Vanilla JavaScript website and volunteer editor on Cloudflare Workers Static Assets, D1 and R2. Content changes publish immediately without GitHub commits or deployments.

## Deployment status

Verified staging: https://fodd-website.support7731.workers.dev

Worker: `fodd-website`. Account: `Support@leoturnbull.com's Account` (`9f0bca03febd803f5ebb472b74a1d206`). D1: `fodd-content`; R2: `fodd-media`.

The production domain is https://friendsofdentondene.org. Its zone is absent from the authenticated Cloudflare account's accessible zones. Production still serves the original GitHub Pages site. DNS and mail records have not been changed. Keep this migration on `codex/workers-migration` until cutover; merging the removal of the old root HTML into main before cutover would disrupt GitHub Pages.

## Run locally

Use Node 24 LTS and npm. Run from this folder:

```sh
npm ci
npm run db:local
npm run dev
```

Open http://127.0.0.1:8787. Local D1/R2 are isolated from remote storage and persist under `.wrangler`. Initialise a local admin as described below. The supplied credentials are already installed remotely; do not reset them on ordinary deployments.

## Deploy updates

```sh
npx wrangler whoami
npm test
npx wrangler d1 migrations apply fodd-content --remote
npm run deploy
```

Verify the account above before applying remote commands. Wrangler builds the local QR and Quill assets automatically. Migrations run once; seed inserts do not overwrite existing page edits. Never re-create D1/R2 or delete `.wrangler` to deploy code. Keep account and resource IDs in `wrangler.jsonc`.

For the domain cutover, first obtain access to the existing zone and export its DNS records. Confirm that zone belongs to the intended account. Add a Workers custom-domain route for `friendsofdentondene.org` in `wrangler.jsonc`, set `STAGING` to `false`, deploy, and verify HTTPS, all nine pages, `/admin`, media, redirects and a reversible edit. Preserve all MX/TXT/mail-routing records. Decide the `www` redirect from the existing DNS configuration. Keep the original GitHub Pages deployment available until the new domain passes verification. If cutover fails, restore only the recorded website DNS/routing settings. Do not change nameservers or move the zone as an improvised workaround.

## Volunteer editing

Visit `/admin`, log in, select a page and click the text. Formatting buttons support headings, bold, italics, lists and links. Appearance controls use safe presets from the original design. Photo controls include size, crop fit and focal position.

Use **Save draft** for private work, **Preview** to review it and **Publish changes** to update the website. **Move up/down**, **Duplicate**, **Remove** and **Undo last change** manage sections. Leaving with unpublished edits shows a warning. If another editor publishes first, reload after saving your work separately rather than overwriting their changes.

Add an **Event card** with its date, times, location and poster. Past dates automatically move to Past events. Add **Photo** sections to the Photos page, with captions and alt text. Hide sections through Appearance and visibility. Public photo submissions are not automatically accepted or published.

Use **Media library and document replacement** to upload PDFs and photos (JPG, PNG or WebP; 10 MB maximum). Copy a new file's `/media/...` link into a button. Use **Replace file** on an existing item to preserve its public link. The About constitution already uses a replaceable R2 link.

Use **Restore a previous version** to publish an earlier page. The current version remains in history. **Change password** ends all sessions. The specified initial account was installed through a salted password hash; no password is in the repository.

## Admin recovery

`scripts/bootstrap.js` reads a new password from standard input and writes an ignored SQL file containing only a salted hash. In PowerShell, use a hidden prompt:

```powershell
$credential = Read-Host 'New admin password' -AsSecureString
$plain = [System.Net.NetworkCredential]::new('', $credential).Password
$plain | node scripts/bootstrap.js
Remove-Variable plain,credential
npx wrangler d1 execute fodd-content --remote --file=bootstrap.private.sql
Remove-Item -LiteralPath bootstrap.private.sql
```

Use `--local` instead for local development. Reset invalidates all sessions. Login limits expire after 15 minutes. Never put passwords in command arguments, logs, source code or GitHub tokens.

## Backups and recovery

The editor's **Download content backup** exports pages, revisions and current/historical media references without credentials. Store it privately and download the referenced files too; JSON alone is not a media backup.

For a full database backup use `npx wrangler d1 export fodd-content --remote --output=backup.private.sql`. This includes authentication data and must remain private. Back up R2 objects separately using its S3-compatible interface or `wrangler r2 object get fodd-media/<object_key> --remote --file=<local-file>` for keys in the export. Replacement files retain previous immutable objects; to restore one, download the old object and upload it through Replace file.

Use D1 Time Travel from the Cloudflare dashboard for database-wide recovery after recording the current bookmark/export. Restore R2 separately if necessary. For code-only regression use `npx wrangler rollback` to a known deployment, or redeploy the previous Git commit. Worker rollback does not roll back D1 or R2. Prefer forward database migrations and never replay seed SQL as a content restore.

Original source is preserved in Git at `a39fabc8912746da993a9344249247470b96baae` and the local `../fodd-original.bundle` backup. Original correspondence/attachments are kept outside this repository in `../research`.

## Verification and remaining content

- Seven unit tests and 55 integration assertions passed locally and on staging: authentication, sessions, password change, CSRF, XSS, drafts, publish/conflicts, revisions, PDF upload/replacement, events, gallery and logout.
- Public-page/asset checks passed after redeployment; uploaded media remained available. Desktop and 390px mobile layouts and a real browser publication were reviewed.
- Run `npm test`. `tests/integration.js <origin>` accepts the admin password on stdin, temporarily edits/restores content and password, and leaves verification uploads. Run it only against a controlled environment. `scripts/check-public.js` additionally uses the local research persistence record from that run.
- Heritage historical copy and Maps suggested walks contain labelled Lorem ipsum. The signage PDF is explicitly an archived unfinished draft, not route guidance. Final corrected map and downloadable walks were not supplied. Font ZIP/PSD working files were not imported; the original font families and supplied published artwork are retained. The Google membership form currently asks visitors to sign in to Google.
- Quill 2.0.3 has a low-severity HTML-export advisory (GHSA-v3m3-f69x-jf25), with no patched release reported. All exported HTML is sanitised server-side before preview, draft or publication; public output is sanitised again, with restrictive CSP. `npm audit --omit=dev` is clean; full audit reports this one advisory. Review upstream updates before changing the editor dependency.
- Historical exposed GitHub credentials were never reused. Their revocation could not be performed through available access and remains an owner action.

See `docs/requirements.md` for the research and acceptance mapping. Production completion remains blocked on zone access; staging success is not a production cutover.
