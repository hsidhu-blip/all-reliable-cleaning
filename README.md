# {{BUSINESS_NAME}}: lead-generation website

A static, multipage site for a {{CITY_STATE}} cleaning business. It has no build step, no frameworks and no dependencies. Every page uses relative paths, so it works from `file://` and from any static host.

```
index.html                          Home: all services, quote form in the hero
end-of-lease-cleaning-perth.html    Google Ads landing page (no nav)
regular-house-cleaning-perth.html   Google Ads landing page (no nav)
office-cleaning-perth.html          Google Ads landing page (no nav)
carpet-deep-cleaning-perth.html     Google Ads landing page (no nav)
about.html                          About
contact.html                        Contact and quote form
thank-you.html                      Post-submit page (noindex), fires the conversion
assets/css/styles.css               Shared styles. Brand colours live in :root
assets/js/main.js                   Shared script (defer). CONFIG object at the top
assets/img/logo.svg                 Wordmark and mark for light backgrounds
assets/img/logo-mark.svg            Mark only
assets/img/favicon.svg              Favicon
robots.txt, sitemap.xml
```

## 1. Replace the placeholders

Every unknown fact is a literal `{{TOKEN}}`. A project-wide find-and-replace covers every file. When you're done, this command should print nothing:

```sh
grep -rn "{{" --include=*.html --include=*.js --include=*.css --include=*.txt --include=*.xml .
```

"All HTML" means all 8 pages.

### Business and contact

| Placeholder | File(s) | Replace with |
|---|---|---|
| `{{BUSINESS_NAME}}` | All HTML, `styles.css` and `main.js` (comments only) | Trading name, e.g. `All Reliable Cleaning`. The logo artwork says "All Reliable Cleaning". If the name changes, redraw the `<text>` in the inline header SVG (all HTML) and in `logo.svg`. |
| `{{CITY_STATE}}` | All HTML | Service city and state, e.g. `Perth WA`. The suburb lists, the landing-page H1s/titles and the file names are Perth-specific. Update them too if the city changes. |
| `{{SERVICES}}` | All HTML (JSON-LD `description`) | Plain-English list, e.g. `end of lease, regular house, office and carpet steam cleaning` |
| `{{PHONE}}` | All HTML (shown as text and used in `tel:` links) | The real number, e.g. `08 9xxx xxxx` or `04xx xxx xxx`. Spaces are fine in `tel:` links. |
| `{{EMAIL}}` | All HTML | Enquiries email address |
| `{{ABN}}` | All HTML (footer) | The registered ABN (check it on abr.business.gov.au) |
| `{{OPENING_HOURS}}` | `contact.html` | e.g. `Mon–Sat 7am–6pm` |
| `{{SITE_URL}}` | All HTML (canonical, JSON-LD), `robots.txt`, `sitemap.xml` | Live origin with **no trailing slash**, e.g. `https://www.example.com.au` |
| `{{PRIVACY_POLICY_URL}}` | All HTML (form note and footer) | Full URL of your privacy policy. Google Ads can disapprove lead-form ads without one. Host it in GHL or on your domain. |
| `{{ABOUT_STORY}}` | `about.html` | 2–4 true sentences: who started the business, when, and why. Then remove the "Placeholder:" label and the dashed box (`ph-block` class). |

### Trust claims (confirm each one is true, or delete it)

| Placeholder | File(s) | Replace with |
|---|---|---|
| `{{GOOGLE_RATING}}` | All HTML (trust strip) | Current Google Business Profile rating, e.g. `4.9`. If there are no reviews yet, delete that `<li>`. |
| `{{REVIEW_COUNT}}` | All HTML (trust strip) | Current Google review count |
| `{{YEARS_IN_BUSINESS}}` | All HTML (trust strip), `about.html` | Whole number of years trading |
| `{{INSURANCE_DETAILS}}` | All HTML (trust strip, footer), `office-cleaning-perth.html`, `about.html` | e.g. `$20M public liability` (match the certificate of currency) |
| `{{POLICE_CHECK_DETAILS}}` | All HTML (trust strip), `office-cleaning-perth.html`, `about.html` | e.g. `Every cleaner holds a current National Police Certificate` |
| `{{GUARANTEE_DAYS}}` | All HTML (trust strip, guarantee terms, FAQs, meta descriptions) | Number of days a re-clean can be claimed, e.g. `3` or `7` |

### Policies

| Placeholder | File(s) | Replace with |
|---|---|---|
| `{{SAME_DAY_CUTOFF}}` | `index.html`, `contact.html` | Time before which requests get a same-day reply, e.g. `2pm weekdays` |
| `{{RESCHEDULE_NOTICE_HOURS}}` | `index.html`, `contact.html`, all 4 landing pages | Free rebooking notice, e.g. `48` |
| `{{CANCELLATION_NOTICE_HOURS}}` | `regular-house-cleaning-perth.html`, `office-cleaning-perth.html` | Cancellation notice for recurring services, e.g. `48` |
| `{{CARPET_DRY_HOURS}}` | `carpet-deep-cleaning-perth.html` | Typical drying time range, e.g. `2–4` |

### Prices (number only: the `$` and "from" are already in the markup)

| Placeholder | File(s) | Replace with |
|---|---|---|
| `{{PRICE_END_OF_LEASE_1BED}}` | `end-of-lease-cleaning-perth.html`, `index.html` | Starting price, 1 bed / 1 bath |
| `{{PRICE_END_OF_LEASE_2BED}}` | `end-of-lease-cleaning-perth.html` | Starting price, 2 bed / 1 bath |
| `{{PRICE_END_OF_LEASE_3BED}}` | `end-of-lease-cleaning-perth.html` | Starting price, 3 bed / 2 bath |
| `{{PRICE_REGULAR_WEEKLY}}` | `regular-house-cleaning-perth.html` | Per-visit starting price, weekly |
| `{{PRICE_REGULAR_FORTNIGHTLY}}` | `regular-house-cleaning-perth.html`, `index.html` | Per-visit starting price, fortnightly |
| `{{PRICE_REGULAR_ONEOFF}}` | `regular-house-cleaning-perth.html` | One-off clean starting price |
| `{{PRICE_OFFICE_SMALL}}` | `office-cleaning-perth.html`, `index.html` | Per-visit starting price, small office |
| `{{PRICE_OFFICE_MEDIUM}}` | `office-cleaning-perth.html` | Per-visit starting price, medium office |
| `{{PRICE_OFFICE_LARGE}}` | `office-cleaning-perth.html` | Per-visit starting price, large or multi-floor |
| `{{PRICE_CARPET_1ROOM}}` | `carpet-deep-cleaning-perth.html`, `index.html` | Starting price, 1 room |
| `{{PRICE_CARPET_3ROOMS}}` | `carpet-deep-cleaning-perth.html` | Starting price, 3 rooms |
| `{{PRICE_CARPET_5ROOMS}}` | `carpet-deep-cleaning-perth.html` | Starting price, 5 rooms |

### Testimonials (real, verified, with the customer's permission)

Each block has three placeholders, `_QUOTE`, `_NAME` (e.g. `Sarah M.`) and `_SUBURB`, numbered 1 to 3. Once a block holds a real review, delete its `<span class="ph-badge">Placeholder review…</span>` line and the "These blocks are placeholders…" intro sentence in that section. Never publish invented reviews.

| Placeholder set | File |
|---|---|
| `{{TESTIMONIAL_1_QUOTE}}` … `{{TESTIMONIAL_3_SUBURB}}` | `index.html` |
| `{{EOL_TESTIMONIAL_1_QUOTE}}` … `{{EOL_TESTIMONIAL_3_SUBURB}}` | `end-of-lease-cleaning-perth.html` |
| `{{REGULAR_TESTIMONIAL_1_QUOTE}}` … `{{REGULAR_TESTIMONIAL_3_SUBURB}}` | `regular-house-cleaning-perth.html` |
| `{{OFFICE_TESTIMONIAL_1_QUOTE}}` … `{{OFFICE_TESTIMONIAL_3_SUBURB}}` | `office-cleaning-perth.html` |
| `{{CARPET_TESTIMONIAL_1_QUOTE}}` … `{{CARPET_TESTIMONIAL_3_SUBURB}}` | `carpet-deep-cleaning-perth.html` |

### Integrations

| Placeholder | File(s) | Replace with |
|---|---|---|
| `{{GHL_WEBHOOK_URL}}` | `assets/js/main.js` (`CONFIG`), and the form `action` on `index.html`, `contact.html` and the 4 landing pages (no-JS fallback) | GoHighLevel inbound webhook URL (Automation → Workflow → trigger "Inbound Webhook") |
| `{{GA4_ID}}` | `assets/js/main.js` (`CONFIG`) | GA4 Measurement ID, e.g. `G-XXXXXXXXXX` |
| `{{GADS_ID_AND_LABEL}}` | `assets/js/main.js` (`CONFIG`) | Google Ads **lead form** conversion `send_to` value, e.g. `AW-123456789/AbCdEfGhIjk` |
| `{{GADS_CALL_ID_AND_LABEL}}` | `assets/js/main.js` (`CONFIG`) | Optional. A second Ads conversion action for **website call clicks** (category "Phone call lead"), e.g. `AW-123456789/XyZ123`. Leave the placeholder to switch it off. |

gtag.js only loads once an ID no longer contains `{{`. The honeypot field (`fax`) is never sent.

### What the webhook receives

Every lead POSTs these URL-encoded fields. Map them to GHL contact fields; create custom fields for the attribution ones.

| Field | Contents |
|---|---|
| `name`, `phone`, `suburb`, `service`, `message` | What the visitor typed or chose |
| `gclid`, `gbraid`, `wbraid` | Google Ads click IDs from the ad's landing URL. Turn on **auto-tagging** in Google Ads. They let you import offline conversions ("booked job") from GHL back into Ads. |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | UTM tags from the landing URL. Use a tracking template such as `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}`. |
| `landing_page` | The page the ad click landed on |
| `submitted_from` | The page the form was sent from |

Click IDs and UTMs are kept in the visitor's browser for 90 days, so a lead who comes back later is still credited to the ad. Empty fields are sent as empty strings.

### Form length

On the four landing pages, visitors see only **name, phone and suburb**. The service is already chosen from the ad and shows as a one-line summary with a "Change" link. The optional note sits behind "+ Add a note (optional)". The home and contact pages still show the Service dropdown. The webhook receives the same fields either way, and without JavaScript the full form shows.

### Exit-intent pop-up

On desktop, every page except thank-you shows a short **name + phone** pop-up whenever the cursor leaves through the top of the window (towards the tabs or close button).
- It shows on every exit attempt. After it's closed it re-arms after 2 seconds (`CONFIG.EXIT_REARM_MS` in main.js); the pause stops it reopening in a loop while the cursor sits at the window edge.
- It closes with the X, Esc, a click on the dimmed backdrop, or "No thanks". It never blocks leaving and never touches the back button. Back-button traps break Google Ads' destination and abusive-experience policies, so there's deliberately no phone version (phones keep the sticky Call / Quote bar).
- It stops for the rest of the visit once a lead has been sent.
- Leads arrive with `form_type=exit-intent` (main forms send `form_type=main`). On landing pages the service is filled in from the page; suburb arrives empty, so ask for it on the callback.
- GA4 receives an `exit_intent_shown` event each time it opens, so you can compare shows against `generate_lead`.

### Service dropdown values

The form's **Service** dropdown is grouped the same way as the site menu. GHL receives one of these exact values in `service`, so you can branch the workflow on them:

- Residential: `End of lease cleaning`, `Regular house cleaning`, `Carpet steam cleaning`, `Other residential cleaning`
- Commercial: `Office cleaning`, `Other commercial cleaning`

Link straight to the contact form with a service already chosen with `contact.html?service=Other%20commercial%20cleaning#quote` (any value above, with spaces as `%20`). The menu and footer already use this for the two "Other" options.

### Enhanced conversions

When `GADS_ID_AND_LABEL` is set, the visitor's phone number (converted to `+61…` format) is held in session storage just long enough to reach thank-you.html. It's passed to Google with `gtag('set', 'user_data', …)` for enhanced conversions, which Google hashes before sending, then deleted. Switch on **Enhanced conversions for leads (Google tag)** in the Ads conversion settings, and mention it in your privacy policy.

### Suburb-matched headlines (`?area=`)

Add `?area=Joondalup` (or a `{_area}` custom parameter) to a landing-page final URL. The H1 then reads "End of Lease Cleaning Joondalup: Bond Back Guaranteed" and the suburb field is pre-filled. Only suburbs already in that page's suburb list are accepted. Anything else is ignored and the page keeps "Perth". Use it for suburb ad groups or location-targeted campaigns to lift ad relevance and Quality Score.

### Brand colours

| Placeholder | File | Default |
|---|---|---|
| `{{PRIMARY_COLOUR}}` → `--primary-colour` | `assets/css/styles.css` `:root` | `#0B1F3A` navy |
| `{{ACCENT_COLOUR}}` → `--accent-colour` | `assets/css/styles.css` `:root` | `#22D3EE` aqua |
| `{{CTA_COLOUR}}` → `--cta-colour` | `assets/css/styles.css` `:root` | `#FF7A1A` orange (conversion buttons only) |

Edit the hex values, not the comments. Every other colour is derived with `color-mix()`. The standalone SVG files and the `theme-color` meta tag hold hard-coded copies of the navy and aqua values. Update those too if you change the brand colours. Button text is navy on orange (about 6.3:1 contrast). If you change the colours, recheck contrast.

### Photos

All 13 photos are free stock photos from **Unsplash**, used under the [Unsplash License](https://unsplash.com/license). That licence allows free commercial use, including on websites and in Google Ads, and doesn't require credit. None of them show people, so no stock person can be mistaken for your staff. They're stored in `assets/img/photos/` at 1200 × 800 JPG, 78–164 KB each, and lazy-loaded below the fold.

| File | Used on | Original |
|---|---|---|
| `eol-kitchen.jpg` | End of lease (large), home service card | https://images.unsplash.com/photo-1484154218962-a197022b5858 |
| `eol-bathroom.jpg` | End of lease | https://images.unsplash.com/photo-1584622650111-993a426fbf0a |
| `eol-living.jpg` | End of lease | https://images.unsplash.com/photo-1560448204-e02f11c3d0e2 |
| `regular-living.jpg` | Regular cleaning (large), home service card | https://images.unsplash.com/photo-1600607687939-ce8a6c25118c |
| `regular-kitchen.jpg` | Regular cleaning | https://images.unsplash.com/photo-1556911220-bff31c812dba |
| `regular-bathroom.jpg` | Regular cleaning | https://images.unsplash.com/photo-1620626011761-996317b8d101 |
| `office-desks.jpg` | Office (large), home service card | https://images.unsplash.com/photo-1462826303086-329426d1aef5 |
| `office-kitchen.jpg` | Office | https://images.unsplash.com/photo-1497366216548-37526070297c |
| `office-reception.jpg` | Office | https://images.unsplash.com/photo-1524758631624-e2822e304c36 |
| `carpet-closeup.jpg` | Carpet (large), home service card | https://images.unsplash.com/photo-1600166898405-da9535204843 |
| `carpet-room.jpg` | Carpet | https://images.unsplash.com/photo-1600121848594-d8644e57abab |
| `carpet-stain.jpg` | Carpet | https://images.unsplash.com/photo-1527515637462-cff94eecc1ac |
| `about-home.jpg` | About | https://images.unsplash.com/photo-1554995207-c18c203602cb |

- **Photographer credits:** Unsplash's search pages block automated access, so these were taken straight from Unsplash's image server and the photographer names weren't captured. Credit isn't required. If you'd like to credit them anyway, open an "Original" link and use "Search image with Google" to find the photo's Unsplash page.
- **Replacing a photo:** overwrite the file and keep the same name, size (1200 × 800) and shape (3:2), ideally under 200 KB (squoosh.app). Then update its `alt` text in the HTML (search for the file name).
- **Better than stock:** your own photos of real jobs. Swap them in as you get them, starting with the large photo on each landing page.
- **About page:** `about-home.jpg` is a clean living room, not a team photo, because stock people presented as your team would be misleading. When you have a real team photo, use it here.

## 2. Pre-launch checklist

**Webhook**
- [ ] `{{GHL_WEBHOOK_URL}}` replaced in `main.js` and in the form `action` attributes.
- [ ] Submit a test lead on every page with a form. Check that the GHL contact gets `name`, `phone`, `suburb`, `service` and `message`, and that the landing pages send the right preselected service.
- [ ] Fill in the hidden honeypot in DevTools (`document.querySelector('[data-hp]').value='x'`), then submit. You should land on thank-you.html and no contact should appear in GHL.
- [ ] The DevTools console shows no "GHL_WEBHOOK_URL placeholder" error.

**GA4 and Google Ads**
- [ ] IDs set in `CONFIG`. In GA4 DebugView / Tag Assistant, confirm `page_view` fires on every page.
- [ ] Tap a phone link and confirm a `click_to_call` event, plus the call conversion if `GADS_CALL_ID_AND_LABEL` is set.
- [ ] Open a landing page with `?gclid=test123&utm_campaign=test`, submit a lead, and check the GHL contact shows `gclid=test123` and `utm_campaign=test`.
- [ ] Open a landing page with `?area=Joondalup` and check the headline and suburb field update.
- [ ] Submit a test lead and confirm `generate_lead` (GA4) and the Ads `conversion` fire once on thank-you.html. Reload the page: neither should fire again. Opening thank-you.html directly should fire neither.
- [ ] In Google Ads, set the conversion action to "Count: one" and check it shows "Recording conversions".
- [ ] Mark `generate_lead` as a key event in GA4.
- [ ] In Google Ads, turn on auto-tagging and enhanced conversions for leads. Optionally set up offline conversion import from GHL using `gclid`.

**Claims the client must confirm in writing**
- [ ] Bond-back guarantee and re-clean guarantee terms (index, all landing pages, about, thank-you), including `{{GUARANTEE_DAYS}}` and the exclusions. The site states the guarantee is a free re-clean, never a bond refund.
- [ ] "Free quote", "same-day response" and `{{SAME_DAY_CUTOFF}}`, plus the "price we quote is the price you pay" promise.
- [ ] Suburb lists (index, end of lease, regular, carpet: residential list; office: business list). Remove any suburb the business doesn't service.
- [ ] Every price placeholder and the included-items checklists on each landing page.
- [ ] Insurance (`{{INSURANCE_DETAILS}}`, matching the certificate of currency) and police checks (`{{POLICE_CHECK_DETAILS}}`).
- [ ] Rating, review count and years in business are current and accurate.
- [ ] Operational copy: "we bring the equipment and products", "truck-mounted or portable extraction", "receipt for your property manager", the office walkthrough, after-hours access and keyholding, and the rebooking and cancellation notice periods.
- [ ] Testimonials are real, verified and approved by the customer, with the placeholder badges removed.
- [ ] `{{PRIVACY_POLICY_URL}}` points at a live privacy policy that mentions Google Ads/Analytics cookies, enhanced conversions and GHL. Google Ads and the Australian Privacy Principles expect one when you collect personal information.

**Final**
- [ ] The grep command in section 1 returns nothing.
- [ ] Spot-check at 390px and on desktop. The landing-page quote form, including the submit button, should sit above the fold on a phone.
- [ ] Submit `{{SITE_URL}}/sitemap.xml` in Google Search Console.

## 3. Deploy

The site is plain files. Deploy the repository root as-is; it has no build command.

### Netlify
1. Netlify → **Add new site → Import an existing project** (or drag the folder into **Deploy manually**).
2. Leave the build command empty and set the publish directory to `/` (the repo root).
3. Deploy, then **Domain management → Add a domain** and enable HTTPS.
4. Set `{{SITE_URL}}` to the final domain and redeploy.

### Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** (or **Upload assets**).
2. Framework preset: **None**. Leave the build command empty. Build output directory: `/`.
3. Deploy, then **Custom domains → Set up a domain**.
4. Cloudflare serves `/about.html` at `/about` as well. Canonicals point at the `.html` URLs, so keep links as they are.

### GoHighLevel funnel embed
Use either option.
- **Option A, host elsewhere and link from GHL (recommended):** deploy to Netlify or Cloudflare, then point your Ads final URLs at the landing pages. The forms post straight into your GHL workflow via the webhook.
- **Option B, inside a GHL funnel:**
  1. Upload `assets/css/styles.css`, `assets/js/main.js` and the three SVGs to **Media Library**, and copy their URLs.
  2. Create one funnel step per page. Add a **Custom JS/HTML** element set to full width, with no section padding.
  3. Paste the page's `<body>` contents into the element. Paste `<link rel="stylesheet" href="…styles.css">`, `<script>document.documentElement.classList.add('js')</script>` and `<script src="…main.js" defer></script>` into the step's **Tracking Code → Header**. Use the Media Library URLs in place of the relative `assets/…` paths.
  4. Rename the internal links to your funnel step paths: `thank-you.html` in `CONFIG.THANK_YOU_URL` in main.js, plus the nav and footer links.
  5. Set each step's SEO title and description from the page `<title>` and meta description, and set the thank-you step to noindex.
  6. Test with the pre-launch checklist above. GHL can also inject its own tracking, so don't add GA4 twice.
