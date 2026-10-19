# Contributing to Classic Themes

## Development

```bash
npm run build      # build into dist/
npm run test       # check every theme file
npm run typecheck  # type-check the tests
npm run validate   # check manifest.json and the theme CSS
npm run format     # format the code with Prettier
```

## Docs

The docs for this plugin are in [docs/](docs/) and are published at https://docs.termix.site/plugins/classic-themes. See [writing docs](https://docs.termix.site/develop/docs).

## Themes

Each theme is a file in `themes/` with its rules under the theme's own class. Add it to `contributes.themes` in `manifest.json` and add its name to `locales/en.json`.
