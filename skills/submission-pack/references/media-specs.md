# Media specs

Sizes, caps and recipes for everything visual a judge sees outside the live demo. The limits are the ones the builder met on real events; every form states its own, so read the form's hint and write the event's caps into BULLSEYE.md (Contract) and `maxFileMB` in sweep.config.json before you make anything. Every command below was run on Windows 11 with Node 22, Playwright Chromium and ffmpeg 7.1.

Paths like `<submission-pack>/scripts/qr.py` mean this skill's folder (`${CLAUDE_SKILL_DIR}` in Claude Code).

## 1. Sizes

| Asset | Size | Format and weight | Shows up in | Notes |
|---|---|---|---|---|
| OG card | 1200 × 630 | PNG, under 1 MB (aim for 300 KB) | link previews in chat apps and social sites; the README hero | Built from the design tokens, numbers read from facts |
| Devpost thumbnail and gallery | 3:2, for example 1200 × 800 | PNG or JPG, keep each under 5 MB | the project card and the gallery | VyaparAI used 1200 × 800 for the thumbnail and three gallery images |
| YouTube thumbnail | 1280 × 720 | PNG or JPG, under 2 MB | the video page and embeds | Pad the OG card (section 5) |
| dev.to cover | 1000 × 420, or 2000 × 840 at 2x | PNG or JPG | the post header | Detour built it from the OG card at 2000 × 840 |
| README GIF | 720 px wide, 9 fps, 10 to 16 s | GIF under 5 MB | "See it run" in the README | Detour's was 2.1 MB |
| Screenshots | 1440 × 900 and 390 × 844, device scale factor 2 | PNG in the README; JPEG quality 80 to 85 inside PDFs | README, gallery, deck | From the production build |
| Favicon and icons | 32 × 32, 180 × 180, 512 × 512 | PNG, or an SVG favicon | browser tab, home screen, PWA manifest | Next `app/icon.tsx`, or an SVG data URI |
| Logo | 256, 512 and 1024 px | PNG | forms that ask for a logo | Bridge shipped all three |
| README banner | about 1600 × 400, rendered at 2x | SVG or PNG | top of the README when there is no OG card | RegSutra's banner is 1600 × 380 |
| QR code | 600 px wide or more | PNG and SVG | last slide, booth card, poster | `scripts/qr.py` |

## 2. Caps the builder met

| Where | Cap | What happened |
|---|---|---|
| Devpost hackathons | demo video as a YouTube or Vimeo link, usually under 3:00; OpenAI Build Week: under 3 minutes, public, with audio | StorePilot's checklist: "Video < 3:00, audio narration, uploaded public on YouTube, link works incognito" |
| Hack2skill (IDBI Innovate) | video at most 3:00 | NAADI's script ran 3:15 and was cut; its demo script opens with "do not submit 3:15" |
| hackculture.io (NABARD) | PDF upload under 10 MB | DhanDrishti's deck went over; JPEG screenshots and no raster grain brought it under |
| Smart India Hackathon | idea PDF at most 10 MB; title at most 100 characters, description 50,000, abstract 10,000 | ORCA's form copy carries the budgets in each heading |
| BOI × IIT Hyderabad, round 1 | idea PDF at most 1 MB | MuleShot subset its fonts: 1060 KB to 603 KB with no visual change; 698 KB final |
| ET AI Hackathon | video of 3 to 4 minutes, upload at most 50 MB or a Drive link | "make the Drive link public, test incognito" |
| GitHub | warns above 50 MB per file, rejects above 100 MB | the sweep's defaults |

> Field note (DhanDrishti · NABARD Hackathon @ GFF 2026): The deck was rebuilt as HTML to PDF in a single day and came out over the 10 MB upload cap; one more commit switched the screenshots to JPEG and dropped a raster grain layer to get under it. Write the cap into `maxFileMB` on day 1.

## 3. Screenshots from the production build

- Build and serve what judges get: Next `next build && next start -p 3005` (or `devIndicators: false` in next.config, which removes the badge in dev too); Vite `vite build && vite preview`; a Python app through the same server and port the README gives.
- Seed data that tells the story (named cases, the hero case and the negative case), dismiss cookie banners, close personal tabs, turn notifications off.
- Wait for fonts and for every finite animation. Infinite loops never finish, so skip them, or load the product's capture switch (`?noanim`) or reduced motion.
- Name files `<screen>-<width>-<scheme>.png`. Use the viewport, not the full page, for README images; full pages are for reviews.
- For quick 390 and 1440 captures at scale 1, sibling skill missile has `scripts/shots.mjs`. README images need scale 2:

```js
// shots.mjs: production screenshots at 1440 and 390 px, device scale factor 2, light and dark.
// Run from the project root: node shots.mjs http://localhost:3005 docs/images
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'noop.js'));
const load = (name) => { try { return require(name); } catch { return null; } };
// The project's Playwright first, then the one PLAYWRIGHT_MODULE points at.
const pw = load('playwright') || load('@playwright/test') || (process.env.PLAYWRIGHT_MODULE && load(process.env.PLAYWRIGHT_MODULE));
if (!pw) throw new Error('Playwright is missing: npm i -D playwright && npx playwright install chromium, or set PLAYWRIGHT_MODULE');

const base = process.argv[2] || 'http://localhost:3005';
const outDir = process.argv[3] || 'docs/images';
const routes = ['/'];                                   // add deep links: '/control?scenario=one&run=1'
fs.mkdirSync(outDir, { recursive: true });
// Playwright's own Chromium first, then an installed Chrome, then Edge.
async function launch() {
  for (const channel of [undefined, 'chrome', 'msedge']) {
    try { return await pw.chromium.launch({ channel }); } catch (e) { if (channel === 'msedge') throw e; }
  }
}
const browser = await launch();
for (const [width, height] of [[1440, 900], [390, 844]]) {
  for (const colorScheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme });
    for (const route of routes) {
      await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
      // Fonts loaded and every finite animation finished; infinite loops are left running.
      await page.evaluate(async () => {
        await document.fonts.ready;
        const finite = document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity);
        await Promise.all(finite.map((a) => a.finished.catch(() => null)));
      });
      const name = route.split('?')[0].replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
      await page.screenshot({ path: path.join(outDir, `${name}-${width}-${colorScheme}.png`) });
    }
    await page.close();
  }
}
await browser.close();
console.log(`screenshots written to ${outDir}`);
```

It writes 2880 × 1800 and 780 × 1688 images. When Playwright is installed only globally, point `PLAYWRIGHT_MODULE` at it, for example the copy inside the Playwright CLI: `PLAYWRIGHT_MODULE="$(npm root -g)/@playwright/cli/node_modules/playwright" node shots.mjs http://localhost:3005`. In Claude Code the Browser pane can do the same by hand (`resize_window`, then `screenshot`); check each image for the dev indicator, overflow and console errors.

## 4. The OG card, from the design tokens

Two ways, both from the product's own tokens and numbers:

- **Next `app/opengraph-image.tsx`** with `ImageResponse` from `next/og`. Export `size = { width: 1200, height: 630 }`, `alt` and `contentType = 'image/png'`. The renderer (satori) supports flexbox and inline styles only: no CSS variables, no grid, no `background-clip: text`, and fonts must be passed in as ArrayBuffers. Import the numbers from the facts file. The README can then use `https://<host>/opengraph-image` as its hero, so the two never drift (SunPath).
- **A hidden token-built route** (Detour's `/og-card`): a `noindex` page that draws a 1200 × 630 element with the real components, fonts and map, kept out of the sitemap. A script waits for the hero animation, then `await page.locator('#og').screenshot({ path: 'public/og.png' })`.

Content: the name, the claim in six to ten words, three numbers from facts, the event and track. Nothing smaller than about 22 px at 1200 wide, because previews show it at 500 px. Set `metadataBase` to the production URL so the OG URL is absolute, add `og:title`, `og:description` and `twitter:card` = `summary_large_image`, then paste the live URL into a chat app and look at the card.

## 5. Thumbnails and covers from the OG card

Pad or crop the card instead of designing new art (the background colour is your ink token):

```bash
# YouTube, 1280 x 720: fit the width, pad top and bottom
ffmpeg -i public/og.png -vf "scale=1280:-1,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0d1013" yt-thumb.png
# Devpost, 1200 x 800 (3:2): the card is wider than 3:2, so fit the width and pad top and bottom
ffmpeg -i public/og.png -vf "scale=1200:-1,pad=1200:800:(ow-iw)/2:(oh-ih)/2:color=0x0d1013" devpost-thumb.png
# dev.to, 1000 x 420: scale to the width and crop the height
ffmpeg -i public/og.png -vf "scale=1000:-1,crop=1000:420" devto-cover.png
```

When the crop cuts the claim, build the cover on a canvas instead, as Detour did: 2000 × 840, the card scaled to 840 high and centred, the edges filled with the card's background colour and a short fade where the art meets the edge.

## 6. The README GIF

1. Record one flow, the signature moment, against the production build with Playwright `recordVideo` at 1280 × 800 (a context option; the video is saved when the context closes).
2. Trim and encode with a shared palette, so the brand colours stay true:

```bash
ffmpeg -y -ss 1.2 -t 16 -i run.webm -vf "fps=9,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 docs/images/flow.gif
```

3. Keep it under 5 MB and between 10 and 16 seconds, link it to the live page, and put the video link under it.

## 7. Video upload rules

The film itself belongs to sibling skill demo-video. What this skill checks before submitting: unlisted or public (never private), under the cap with a margin of 10 seconds, H.264 and AAC with `+faststart`, captions on, the link opens in a private window and on a phone, and a backup copy in a second place. The sweep's `--check-links` asks YouTube's oEmbed endpoint and fails a private or missing video.

> Field note (NAADI · IDBI Innovate 2026): The demo script ran 3:15 against Hack2skill's 3:00 limit and had to be cut late; the final script opens with the warning "do not submit 3:15". Read the length cap before writing the script.

## 8. QR codes

```bash
python "<submission-pack>/scripts/qr.py" "Live demo=https://<live-host>" "Code=https://github.com/<owner>/<repo>" --out docs/qr --verify
```

- Use them on the last slide of a demo deck, a booth card and a poster. Not in an idea-stage PDF: MuleShot rejected one there as a gimmick.
- Error correction M on screens, Q on print. Dark on light only (the script refuses inverted colours); at least 2.5 cm wide on paper.
- `--verify` decodes each PNG with OpenCV when it is installed. Then scan each code with two phones from about 2 m, the distance from a judge's seat to a screen.
- Keep the generator and its inputs in the repo: FLOODLIGHT's QR images survived, but the script that made them was lost with a scratchpad.

## 9. Titles, descriptions and icons

- Every route has a real `<title>` ("Proof · Detour", never "Create Next App") and a description that states the claim. Check with `curl -s <url> | grep -io "<title>[^<]*"` on each route.
- The favicon comes from the brand mark: Next `app/icon.tsx` at 32 × 32, or an inline SVG data URI.

## 10. Weight discipline for decks and PDFs

Screenshots inside PDFs as JPEG; no raster grain layer; no CSS filters, opacity or blend modes on photos (Chrome rasterizes the page: one layer once pushed a proposal to 18 MB), grades baked into the image instead; fonts subset after printing. The print pipeline and its size gate live in sibling skill pitch-deck.

## 11. Re-shoot rule

Any redesign, rename or new headline number re-shoots the README images, the OG card, the GIF and the thumbnails in the same change. A critic docked Detour after its redesign because "Its media no longer matches the product it describes".
