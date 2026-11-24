# Card images

WorthIt cards show one of three things, in this order:

1. **The listing's own photo.** Only for a dealer or merchant that has given written permission. Off by default.
2. **An openly licensed photo of the model** from Wikimedia Commons, labelled "Illustrative photo" / "车型示意图". It is not the car for sale, and the hover text says so.
3. **Our own illustration** for the car body type or product family. WorthIt owns these drawings.

## 1. Dealer and merchant photos

Each adapter has `imagePermission: false`. To turn one on:

1. Get written permission from the business: an email is enough. It should say that WorthIt may show one cover image of each listing, linked back to the listing.
2. Add a row below with the date, who agreed, and where the email is filed.
3. Set `imagePermission: true` in `scripts/collect/adapters/<site>.mjs`, then run the collector again. Only then is `imageUrl` stored. The core whitelist removes it for every adapter without permission (`keepVehicleFacts`, tested in `src/lib/images.test.ts`).

| Site | Permission | Date | Who agreed | Where the email is filed |
|---|---|---|---|---|
| (none yet) | | | | |

If a business withdraws permission, set the flag back to `false` and re-run. The next collect drops the image.

## 2. Model photos (Wikimedia Commons)

`node scripts/enrich/model-photos.mjs` looks up one photo per make and model:

- **Licences accepted:** CC0, CC BY, CC BY-SA and public domain. NC, ND, fair use and unknown licences are rejected.
- **Which photos qualify:** landscape exterior shots whose file name contains both the make and the model. Interior, badge, wheel and toy shots are skipped.
- **Storage:** a 480 px copy is saved in `public/model-photos/`. The site serves its own copy and never hotlinks Commons.
- **Credits:** author, licence and source URL are kept in `src/data/model-photos.json`. Cards show them in the image's hover text and alt text.
- **Etiquette:** the script sends an identifying User-Agent, makes one request a second, uses `maxlag`, and stops on 403 or 429.
- **No repeat lookups:** models already in the manifest, including those recorded as "none found", are not asked again. To retry a model, delete its key from the manifest.

**Attribution:** CC BY and CC BY-SA require credit. The credit is in each card's hover and alt text, and the full list is in `src/data/model-photos.json`. A visible credits page listing all photos would be a sensible next step.
