# Vibbit plugin release source

`vibbit/` contains the complete 2.18.9 Skill + MCP package, including all four host adapters and the installed Skill's complete-plugin self-updater. Its 234 files and executable flags match the release TGZ. `latest.json` points to the stable complete archive, SHA-256 and content revision used by installed self-checkers. The corrected 2.18.9 package recognizes same-version revision changes; installations from before this correction need one run of the install command below.

Install or migrate with:

```bash
npx -y vibbit-ai/skills install
```

From a checkout, use `node plugins/vibbit/install.cjs install`. The root standalone Skill and `npx skills add vibbit-ai/skills` remain available for legacy standalone installation.

## Verify and rebuild

```bash
node plugins/verify-release.cjs
mkdir -p build
npm pack ./plugins/vibbit --ignore-scripts --pack-destination ./build
```

`release-2.18.9.json` records the current package's file hashes, modes and archive checksums. Build outputs do not belong in Git. The package has no npm dependencies or lifecycle hooks and stays private to prevent accidental registry publication.

For future releases, build and validate the complete package, update source and its checksum manifest, publish immutable release assets, and make `latest.json` visible only when the referenced stable asset is available. Do not point it to a draft or prerelease.

The 2.18.7 assets, tag and checksum manifest are historical and unchanged. Its matching 223-file source remains available at [commit 28dc67a](https://github.com/vibbit-ai/skills/tree/28dc67ae4463ec36002d982b3e1912803449589f/plugins/vibbit). Check out that revision to verify that historical package.

The 2.18.8 tag, assets and checksum manifest remain unchanged. Material/product card adapters in 2.18.9 require corresponding tools from the separately deployed MCP service.

## WorkBuddy and Doubao packages

The release also includes `vibbit-workbuddy-connector-2.18.9.zip` and `vibbit-doubao-plugin-2.18.9.zip`, each with a SHA-256 file. Their public file inventories are recorded in `release-2.18.9-workbuddy.json` and `release-2.18.9-doubao.json`. Their 34 business/picker JavaScript files match the corrected complete package; installation and updates are managed through the respective platform channel.

The assessment correction intentionally replaces the existing 2.18.9 assets and checksum manifest while keeping version 2.18.9. Historical 2.18.7 and 2.18.8 releases remain unchanged.
