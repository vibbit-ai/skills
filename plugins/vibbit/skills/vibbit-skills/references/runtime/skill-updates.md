# Plugin updates

Before the first actual Vibbit operation in each conversation, make one best-effort check for a newer complete plugin. Mark this conversation's attempt before running anything, including when the check fails; do not repeat after rereading the Skill. Skip discussion, dry runs, local-only work, fictional UI demos, production already in progress, and `VIBBIT_AUTO_UPDATE=0`. Follow host execution permissions.

Use the actual loaded Skill directory as `$VIBBIT_SKILL_DIR`:

```bash
node "$VIBBIT_SKILL_DIR/scripts/plugin-update.cjs" auto
```

If the host exposes a stable conversation ID, it is picked up from the host environment; `--session ID` can pass the current real ID. Without one, retain the once-per-conversation marker in conversation state. The checker never substitutes a per-process ID for a conversation ID.

The bundled updater reads the installation's recorded source, target host, and profile. GitHub short-command installations follow the stable manifest; fixed archive installations stay pinned unless explicitly installed with `--update-channel stable`. Manually copied/untracked packages skip automatic installation. A manual update uses `npx -y vibbit-ai/skills install`; after upgrading an old plugin once, future conversations use this self-check.

Only a newer stable version is applied. The updater downloads the complete plugin archive from the recorded Vibbit GitHub repository, checks its SHA-256, then runs its complete installer for this host/profile only. Skill instructions, scripts, adapters and MCP declarations update together. It never runs the standalone `skills update`, updates unrelated Skills, changes the selected account/site, or copies credentials and task data into a release.

Network checks are limited to 10 seconds, archive downloads to 30 seconds, and installation to 120 seconds. The updater stops its own installation process tree on timeout before returning. An automatic update never restarts a client or launches a detached restart worker. It attempts the available host reload and reports `updated_pending_reload` when the active session cannot be confirmed.

For `current`, continue quietly. For `updated`, reread the returned `skillDir/SKILL.md` and the references needed now. For `updated_pending_reload`, keep using the current conversation's loaded version if usable and briefly state that the update will load in a new conversation or after the host's reload. File replacement alone is not proof that the current instructions or MCP tools have reloaded. For `unavailable`, `busy` or `untracked`, continue with the usable local version, mention the fallback briefly, and do not retry in this conversation. `pinned`, `disabled` and `already_checked` need no repeated notice.

For a read-only remote-version check, run the same bundled script with `check` instead of `auto`. The installer's `--check` remains an environment preflight; `--check-updates` reads the remote stable manifest and compares it with that installer's package version. It does not claim that an unrelated installed client is current.
