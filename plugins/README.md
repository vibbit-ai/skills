# Vibbit plugin release source

`vibbit/` contains the complete 2.19.0 Skill + MCP package, the four host adapters, and the installed Skill's self-updater. Its 235 files and executable flags match the release package. `latest.json` points to the stable archive, SHA-256 and content revision.

Install or update with:

```bash
npx -y vibbit-ai/skills install
```

From a checkout, run `node plugins/vibbit/install.cjs install`. The standalone root Skill also supports `npx skills add vibbit-ai/skills`.

## Verify and rebuild

```bash
node plugins/verify-release.cjs
mkdir -p build
npm pack ./plugins/vibbit --ignore-scripts --pack-destination ./build
```

[Package inventory](release-2.19.0.json) records file hashes, modes and archive checksums. The package is private and has no npm dependencies or lifecycle hooks. Keep local builds outside Git.

[WorkBuddy connector inventory](release-2.19.0-workbuddy.json) records the files in the platform import ZIP. Its updates follow the platform channel. Updated material and product cards require the corresponding deployed MCP tools.

For future releases, build and validate the complete package, update source and its checksum manifest, publish the release assets, and publish the stable pointer once the asset is available. Historical package inventories remain in this directory. Check out the corresponding tag to verify historical assets.
