# PricempirePlus

Chrome extension enhancements for Pricempire item pages.

## Development

Feature work is merged from `dev` into `main` through a pull request. A merged
`dev` pull request triggers the release workflow.

## Releases

`.github/workflows/release-chrome-web-store.yml` packages the extension, creates
a GitHub release, uploads the ZIP to Chrome Web Store, and submits it for
publishing.

The source manifest version is treated as a release series. For example,
`"version": "1.0"` is packaged as `1.0.0.<github-run-number>` so each merged
release has a newer Chrome Web Store version. If an existing store item already
uses a later version series, increase `manifest.json` before the first release.

Configure these repository secrets before merging `dev` into `main`:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`

The Chrome Web Store item must exist and its store listing and privacy
information must be completed before API publishing can succeed.
