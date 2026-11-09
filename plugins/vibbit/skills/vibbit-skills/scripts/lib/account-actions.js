'use strict'

const { apiBase, profileForBase } = require('./account-profile')

function accountLinks(base = apiBase) {
  const profile = profileForBase(base)
  if (!profile) return { region: 'custom', links: {}, account_environment_check_required: true }
  return { region: profile.region, links: {
    api_keys: profile.webBase + '/api-keys',
    create_avatar: profile.webBase + '/digital-human-audit',
    avatars: profile.webBase + '/my-digital-human',
    pricing: profile.webBase + '/pricing',
    billing: profile.webBase + '/billing',
  } }
}

function recoveryAction(value, base) {
  const { links, region } = accountLinks(base)
  const common = { region, preserve_completed_results: true, automatic_resubmission: false }
  if (value.status === 'INSUFFICIENT_POINTS' || Number(value.code) === 1007) return {
    ...common, kind: 'credits', ...(links.pricing ? { url: links.pricing } : {}),
    next: 'Open pricing for plans or credit packs in the same account and region. After the user returns, check the original task and continue only the unfinished stage. A terminal failure needs a new submission; topping up does not restart it.',
  }
  if (Number(value.code) === 1008) return {
    ...common, kind: 'quota', ...(links.pricing ? { url: links.pricing } : {}),
    next: 'Check the specific account limit. Do not promise that buying credits resolves a quota restriction.',
  }
  if (Number(value.http_status) === 403 || Number(value.code) === 403) return {
    ...common, kind: 'permissions', next: 'Check the IP allowlist, account permissions, task ownership and region before replacing the key.',
  }
  if (value.kind === 'authentication' || value.kind === 'authentication_required' || Number(value.code) === 401) return {
    ...common, kind: 'authentication', ...(links.api_keys ? { url: links.api_keys } : {}),
    next: 'Reuse verified credentials for the selected site. Carry any Vibbit API Keys URL from the original install message as --site into auth_status and auth_setup. If credentials are missing, open the actual host credential settings or auth_setup --open on an accessible local computer. Use the returned setup_url if automatic opening fails. Never request a key in chat. Verify and continue the saved task.',
  }
}

module.exports = { accountLinks, recoveryAction }
