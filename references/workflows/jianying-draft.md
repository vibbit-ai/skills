# Hand off to the desktop client for a Jianying draft

Use for a Jianying draft, continued editing in Jianying, or opening/installing the desktop client. Cloud editing follows [production paths](hybrid-video.md). Draft handoff requires a valid editing Job ID for the adopted output. Installation guidance and opening with a known ID work without OpenAPI key setup.

## Establish the real Job ID

Take a candidate Job ID from the actual composition receipt or from the user. Preserve its string value, source, and associated output version for desktop validation. The CLI retains `job_id` when composition returns it. The timing and export coverage of production responses still need integration verification. [Composition contract](../api/compose.md)

If the original task completes without a valid Job ID, mark draft export as blocked. Keep the output, OpenAPI task_id, adopted assets and production records for recovery. A verified official work page containing this exact output and a Save to Jianying entry can provide a manual route.

If a draft is an additional deliverable, deliver the completed video and explain that draft export is unavailable. If an editable draft is the sole goal, disclose the blocked endpoint before paid production. An MP4 can be manually imported into Jianying as an ordinary asset, but it does not restore the original separate tracks, subtitles or editable packaging; use that alternative only if the user accepts it.

OpenAPI task_id, material IDs, video URLs, template IDs and local audiovisual plans are not editing Job IDs. Do not invent IDs, use private website endpoints or resubmit paid jobs to obtain one. Installing the client does not resolve this API gap.

## Client installation and preparation

Use the customer's actual computer and account site, not the cloud Agent's machine. Reuse local app/protocol inspection when available. Otherwise report installation status as unknown and ask only for needed OS or Mac-chip information. One unresponsive launch does not prove absence: browser restrictions or pending permission may prevent opening.

When absent, proactively open `/download` on the current account site: [China download page](https://app.vibbit.cn/download) or [international download page](https://app.vibbit.ai/download). Let that page provide current installers, versions, platform selection and installation instructions. Do not maintain direct installer links, pinned installation versions or alternate download channels in the Skill. If the page is known to be awaiting release, explain that it must go live rather than switching the entry point. When the host cannot open the customer's browser, provide the page link for their own computer.

Follow the page to select Windows, Mac with Apple silicon or Mac with Intel. Extract Windows archives completely and retain companion files; move the Mac client into Applications before launch. Follow the page's current instructions for specific steps.
If the chip is unknown, check About This Mac; an Intel-containing browser UA is not sufficient evidence. On phones, inside WeChat or on remote Agent hosts, provide links for the customer's desktop system browser. If the corresponding site or system has no installer, state that limitation instead of switching to another site’s build or inventing support.

Guide the user to sign in with the work's site/account. For draft conversion, copy the actual draft directory from Jianying settings into the client. Refer first-launch problems to the download page’s installation guidance and let the user perform steps requiring system permissions; installation guidance does not authorize Agent changes to system security settings. Download/install on the user's behalf only when explicitly requested and permitted by the host.

When a Job ID is unavailable, installation preparation can proceed while the export remains blocked. Once the client is ready and a real ID is available, resume the original job and reuse its output.

## Open or save according to the request

Check that the client is installed on the user's computer, the scheme is registered, and the job site matches the client environment. Use this URL to open and prefill the task.

```text
agentcy://open?job_id=<URL-encoded real editing Job ID>
```

When the user asks to save the draft and the installed client supports automatic saving, add `auto_save=1`. This parameter was verified in the macOS 1.1.7 app bundle. The client validates the job before converting it and writing to the configured Jianying draft directory.

```bash
open 'agentcy://open?job_id=<URL_ENCODED_JOB_ID>&auto_save=1'
```

Encode the real Job ID as a URL query parameter and pass the complete link as one argument to the system opener. Replace the placeholder before execution. Include only the Job ID and authorized save option. If the draft directory has yet to be configured, 1.1.7 prompts for it and can continue the pending save after setup.

When automatic saving support is unverified, use the link with `job_id` alone and guide the user to the client's Save to Jianying Draft button. Use `agentcy://open` for an app-only request. Remote hosts can provide the appropriate link and a copyable ID for use on the customer's computer.

## Confirm the saved draft

The system opener's success confirms dispatch. Report a saved draft after observing the client's conversion success message or verifying the draft files for this job. Follow the client's actual sign-in, directory setup, or conversion error state to continue the original job.

Record the Job ID and source, adopted version, and save state privately. After dispatch alone, report that the save was requested and awaits client confirmation. Check the original request and draft directory before attempting another conversion.
