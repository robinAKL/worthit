# Languages

English (`en`) is the default. Simplified Chinese is available as `zh-Hans`.
Initial selection uses a supported `?lang=` value, then the saved `worthit.locale`
preference, then `navigator.language`, and finally English. Regional Chinese tags
match `zh-Hans`. An unsupported preference falls through to the next source.

Changing language updates the page, URL, document language, title and description
without a reload. The current query and selected ranking lane stay in place.
Storage being unavailable does not prevent language selection.

To add a language:

1. Add its ID to `Locale` and `LOCALES` in `src/lib/types.ts`.
2. Add a dictionary file in this folder, typed as `Copy` from `en.ts`, including
   its native language name and `Intl` formatting locale.
3. Register the dictionary in `DICTIONARIES` in `registry.ts`. Missing keys or a
   missing supported dictionary cause a TypeScript build error.
4. Provide translated product titles and recommendation reasons in the data
   layer. Product titles fall back to the default title if a translation is absent.

Locale IDs belong to the data contract. The data layer does not depend on the UI
dictionaries. Run `npm run build` and `npm run test` after changes.
