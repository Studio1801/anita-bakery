# Anita's Little Loaf & Co.: website, ordering and owner dashboard

A mockup for Anita's Little Loaf & Co. (sourdough, baked goods and catering, St. George and St. Andrews, New Brunswick). Same system as Nusa: website, live order pages, chat and an owner dashboard, all on one shared database.

- Dashboard: `/dashboard` (password `anitas2026`)
- Brand and menu source: their Instagram, @anitaslittleloafandco (bio, posts and the printed sourdough menu)

## Deploy on Vercel

1. Push this folder to a GitHub repo.
2. Vercel: Add New > Project, pick the repo. Framework Preset: **Other**. Leave Root Directory, Build Command and Output Directory empty. Deploy.
3. Storage > Create Database > **Neon**, Connect (all environments), then Deployments > Redeploy.
4. Open `/dashboard`, sign in. A green dot and **Live** means it's connected.

Optional: set `ANITAS_STAFF_KEY` in Environment Variables to change the dashboard password.
Without a database it still runs, but only inside one browser (fine for a quick demo).

## How it works

- **Bread drop**: customers pick St. George (Magaguadavic Place, 4:30 to 5:00 pm) or St. Andrews (The Wharf, 5:30 to 6:00 pm) and a Thursday. Orders close at the end of the Monday before, as on their Instagram.
- **Farmers' market** (Water Street, booth 21) is built in but switched off for the season. Switch it on in the dashboard under Pickup days.
- **Menu** comes from their printed menu: sourdough $10 (6 flavours), focaccia $10 (7), cinnamon rolls $5 (4), pretzels $5 (2), sandwich loaf $10, rolls 6 for $6. Each flavour can be switched off as sold out.
- **Order page**: Sent, Confirmed, Bagged, Picked up. Updates by itself, with chat. Pay at pickup (cash or e-transfer).
- **Catering**: event form built from what they have catered (soup and sandwiches, chicken parm, creme brulee, doughnut tower). The quote is sent from the dashboard and lands in the customer's chat.
- **Dashboard**: confirm or decline orders, messages, catering quotes, menu, pickup days, history (the Baklava and Nusa toolset), plus:
  - **Next drop bar**: the stamped Thursday, a live countdown to the Monday cutoff, and how full each stop is.
  - **Bake list**: everything to bake for a Thursday by flavour, both stops combined, printable with tick boxes.
  - **Instagram post**: draws the bread drop announcement in the site's style; share or save it, and copy the caption.
  - **Alerts**: a soft chime and a desktop notice for new orders and messages, plus the count in the browser tab.
  - **Text the customer**: one tap opens a ready-written text ("your order is bagged and ready").
- **Live sold out**: switch a flavour off in the dashboard and it strikes through on any open order page within seconds.

## Design

- Concept: a kraft bread bag with a stamped tag. Flour canvas `#eee8dc`, rye ink `#2a1c13`, kraft `#d7bd95`, crumb `#f8f4ec` for raised surfaces, stamp blue `#2c4a8e` only for drop dates and the order countdown, crust `#7a5a40` for secondary text.
- One font: Libre Caslon Text (free, licence in `fonts/OFL.txt`), chosen because their printed menu is set in a Caslon-style serif.
- Signature: the "Next bread drop" tag with a rubber-stamped date and a live countdown to the Monday cutoff.
- Photos: their own photos (cinnamon rolls, focaccia, tarts, peach crumble) drive the home gallery, the catering and story pages and the menu. Products without a photo use simple line drawings; more can be added from the dashboard (Menu tab).
- Motion: one easing curve. Headlines rise out of a mask, the drop tag swings in on its twine and the stamp lands, the photo gallery slides sideways as you scroll, the catering line fills in word by word, a crumb flies to the bag, and every order status change lands as a big stamp on the customer's page.

## Before showing it as real

- Confirm we can use their photos on the site.
- Confirm prices, pickup times, payment methods and whether cinnamon rolls are sold singly.
- Add an email or phone for the footer and terms (only Instagram is known).
- Check allergen wording in the terms.

## Test

`node tools/dev-server.js /full/path/to/folder 3000` runs it locally. `SITE=http://localhost:3000 node tools/two-device-test.js` runs the phone plus laptop test (20 checks, all passing on a fresh database).
