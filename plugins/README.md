# Vibbit plugin release source

`vibbit/` contains the complete 2.20.1 Skill + MCP package, the four host adapters, and the installed Skill's self-updater. Its 246 files and executable flags match the release package. `latest.json` points to the stable archive, SHA-256 and content revision.

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

[Package inventory](release-2.20.1.json) records file hashes, modes and archive checksums. The package is private and has no npm dependencies or lifecycle hooks. Keep local builds outside Git.

[WorkBuddy OAuth connector inventory](release-2.20.1-workbuddy.json) and [Doubao OAuth plugin inventory](release-2.20.1-doubao.json) list the files in the platform import ZIPs. The platform handles updates for these packages.

For future releases, build and validate the complete package, update source and its checksum manifest, publish the release assets, and publish the stable pointer once the asset is available. Historical package inventories remain in this directory. Check out the corresponding tag to verify historical assets.
