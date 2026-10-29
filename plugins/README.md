# Vibbit plugin release source

[`vibbit/`](vibbit/) contains all 223 files from the published [2.18.7 Skill + MCP package](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7), including the installer, both host manifests, production MCP configuration, and the complete adapted Skill. The files and executable flags match the published TGZ; no runtime code was rewritten during this source synchronization.

The standalone Skill remains at the repository root. Its installation command is unchanged:

```bash
npx skills add vibbit-ai/skills
```

This command selects the standalone root Skill. For the complete Skill + MCP installation, use the commands in the [repository README](../README.md#install) or run the checked-out installer with Node.js 20+:

```bash
node plugins/vibbit/install.cjs --host codex --restart
node plugins/vibbit/install.cjs --host workbuddy --restart
```

Finish active desktop tasks before using `--restart`. WorkBuddy's first MCP trust confirmation remains a user action.

## Verify and rebuild

From the repository root, verify the package's file inventory, SHA-256 hashes, and executable flags:

```bash
node plugins/verify-release.cjs
```

[`release-2.18.7.json`](release-2.18.7.json) records the public release URLs, archive hashes, and every package file. To recreate the npm-format TGZ, create an output directory and pack the plugin:

```bash
mkdir -p build
npm pack ./plugins/vibbit --ignore-scripts --pack-destination ./build
```

The `private: true` flag prevents publication to the npm registry; it allows local packing and installation from the public GitHub TGZ. The public package has no npm dependencies or lifecycle hooks. Build outputs do not belong in Git.

This source directory was added in a follow-up commit after the Release was published. The existing release tag and attachments remain unchanged; the release notes link to the matching source commit. GitHub's automatic source archives for the original tag therefore do not contain this follow-up directory.

Future versions should update this source, run the relevant installer checks, and generate a new manifest and new release assets. Do not overwrite the already published 2.18.7 assets or change its recorded hashes.
