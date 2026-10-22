# Migration inventory — 22 October 2026

Baseline: main a39fabc8912746da993a9344249247470b96baae. Original full Git backup is ../fodd-original.bundle, outside the deployment. GitHub Pages serves the current homepage. Repository includes no other navigation pages; About returns GitHub Pages 404. Live homepage wording matches repository. Direct HTTP inspection from this host fails TLS connection reset; browser and search fetch work. Legacy editor logs tokens, stores a readable cookie and commits HTML; it will not ship.

Research: complete relevant 2023–2026 Gmail conversations read, including 29 September, 7 October, 22 October 2026, March design discussions, wildlife text, map revisions, heritage submission discussion and April completion discussions. The current prompt overrides earlier phased delivery and constitution-on-home decisions. Supplied constitution changes Urban Green to Newcastle City Council. Membership wording and Google Form are supplied on 22 October. Wildlife images explicitly belong to the group. Heritage has a tree cross-section image but no completed historical copy. The Stage Four signage PDF is a draft with known route/chevron corrections pending, so it must be clearly labelled as an archive, not definitive route guidance.

Acceptance mapping:
- Home: original intro, logo, Polaroid, fonts, palette, tagline; Facebook and parkrun; remove constitution.
- About: independent voluntary group, purposes, exact approved membership, Form, replaceable April 2026 constitution.
- Events: supplied introduction, Halloween original poster and two activities, monthly litter picks; date-based past separation.
- Maps: embedded location map, directions, clearly qualified historic signage draft, editable walks placeholder.
- Nature: supplied 15 March 2024 wording, five supplied photographs, iNaturalist.
- Heritage: supplied tree image, St James link, editable placeholder; contributions by email for review before publication.
- Accessibility: existing verified path/steps/mud text; no invented facilities.
- Photos: approved gallery, editable captions/order; no automatic public publication. Google Places Photos requires API/billing/attribution and expiring references; owned gallery chosen.
- Contact: public group email; current council reporting links and verified dangerous-tree contact. No private signature contact details.
- QR: generate only actual navigation URLs locally.
- CMS: D1 content, R2 uploads, authentication, session/CSRF/lockout, safe rich text, structured styles, drafts, preview, revisions, optimistic concurrency, document replacement, export.
- Verification: local functional/security integration tests, browser review, remote persistence and upload tests, redeploy check.
- Deployment: correct account verified via Wrangler. Account 9f0bca03febd803f5ebb472b74a1d206. Zone is absent from accessible zone list, so production cutover requires access. No DNS/mail changes authorised in another account.

Sources: Gmail thread IDs 1a0ec6f2e2ab0041, 18b8f26b09cd0568, 18e14792f7a7b1a2, 18e41ec2d8decfd9, 18e4dd8524f3bea4, 18e42d1eeddb085d, 18eccbeeefaf51f6, 18ed7780b78a7d82, 18f01e801e10cd0a, 18dd060844fa9ba2. Private correspondence is not committed.
