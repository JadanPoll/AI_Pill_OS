# AI Pill OS

> Can I operate at the speed of thought?

AI Pill OS is an attempt to asymptotically collapse the distance between human intention and its realization. The human should spend more time thinking, exploring, deciding, and creating, and less time translating those intentions into the mechanical operations of software.

The ambition is not simply to make clicking faster, put an AI chatbot on every webpage, or maximize autonomous execution. It is to make intelligence and computational capabilities available at the point of intention, without requiring the human to constantly switch applications, reconstruct context, remember interface conventions, or manage the underlying machinery.

## What would operating at the speed of thought look like?

- While reading, ask a question about what is in front of you and continue the investigation without reconstructing its context elsewhere.
- While browsing, express what you want to accomplish rather than individually specifying the clicks and navigation necessary to accomplish it.
- While engineering, collect relevant evidence, ask an AI to interpret it, and use the result in the current environment.
- Invoke familiar operations almost immediately; recruit deeper intelligence for unfamiliar or ambiguous problems.
- Retain control over consequential decisions, while software absorbs the repetitive translation and execution work.

Speed of thought is an asymptotic objective, not a latency guarantee. Some thinking benefits from deliberation, unfamiliar knowledge, and productive friction. The point is to remove unnecessary friction, not to eliminate the human's intellectual participation.

## Current direction: Safari first (November 25, 2026)

The primary environment is Safari, the existing signed-in ChatGPT/Gemini web chats and rapidly iterated userscripts. Native Shortcuts are deliberately rare: create one when it unlocks a genuinely valuable OS capability that Safari cannot supply. OpenMinis has reported successful Git inspection, local validation and its own browser navigation; retain those results but defer integration and app switching until a concrete task justifies it. Separate API inference, iCTRL and iSH integration are not current priorities.

### Pocket — universal working tray and handoff (v0.2.1)

[Install / update Pocket.user.js](https://raw.githubusercontent.com/JadanPoll/AI_Pill_OS/main/Pocket.user.js) · [Source](Pocket.user.js).

Collect evidence across sites, Save a discovery for later, or Ask with tray. One installed script owns cross-site GM storage. The temporary working tray and explicitly durable items are separate; previous v0.1.x saved records retain their keys. No server, new model account or separate app. Text, links and JSON only for this slice; rectangular image capture is next after real text handoff acceptance.

**Live demo / acceptance:** Open an existing ChatGPT or Gemini conversation, open Pocket and tap Use this chat. On Wikipedia and GitHub, select real passages, open Pocket and Collect. Dictate a question in the draft, choose Ask with tray, then Open chat. At the selected conversation, open Pocket, review and Copy question, paste into the normal composer and send explicitly. Return to the source and refresh: the receipt says copied, not confirmed sent. Reload and verify the request and previous saved items. Clear tray only when finished; prepared questions preserve their evidence snapshot. Dismiss finished handoffs when no longer useful.

The target is an exact supported conversation URL; opening it may create a new tab rather than focus an existing tab. No automated provider submission or response extraction. The script pulls shared state on open/refresh/resume; no hidden-tab liveness promise. Source defaults to origin + path; edit it for important page/section/document details. Review captured content, use trusted sites only and avoid storing credentials. Storage is local to the installed script/manager; export saved JSON before uninstalling. Native update metadata points to the raw GitHub file; install as an update, not a second copy.

Nine integration-style checks passed executing the actual script with mocked DOM, GM, URL and clipboard (two origins, snapshot, wrong conversation, reload, failure/no acknowledgment, successful copy, source status, durable item preservation). Safari manager behavior, visual usability, and provider handoff still require actual iPad use.

**Canonical persistence:** when asked to preserve a research finding in Kami, use [Kami_Uploads_RSM_Tree](https://github.com/JadanPoll/Kami_Uploads_RSM_Tree)'s existing domain investigation records and source anchors, not a parallel note database or Kami annotation sync. FKEN and Drive remain other explicit destinations. Authorized ChatGPT connector writes and exact readback receipts are the first route, not browser-held credentials.

Keep Eruda/DevTools as the existing separate mini-pill until real usage warrants consolidation. Do not build a task dashboard, worker system, or custom update manager before observing a consequential gap.

### One native bridge: Copy Screenshot

Create a Shortcut named `Copy Screenshot` with two actions: Take Screenshot → Copy to Clipboard (use screenshot output). Invoke with Siri or bind to an unused accessibility gesture if the action picker supports it. Preserve existing double tap until this works. Test by pasting the image directly into an existing web chat. Built-in screenshot Copy and Delete is the fallback. No model action or photo-deletion step needed.

[Current RSM investigation tree](research/INVESTIGATION_TREE.json) and [capability atlas](capabilities.json) preserve the revised priorities and stopping conditions.

## Try the current implementation (v0.3.0)

[Install / view raw AI_Pill.user.js](https://raw.githubusercontent.com/JadanPoll/AI_Pill_OS/main/AI_Pill.user.js) · [Source](AI_Pill.user.js).

Install using your Safari userscript manager (on iPad, import or save the .user.js into the manager's scripts folder if the raw link does not trigger installation). Grant access to a public test site, such as Wikipedia or GitHub, and reload. The script matches all HTTP(S) websites; limit site permissions to what you actually use. The manager must support the pinned Eruda @require dependency. It is third-party code; review before allowing on sensitive sites. No new backend or iSH setup.

**DevTools:** tap AI; the four primary tools are Inspect, Record, Sources and DevTools. Inspect arms the next real tap without intentionally activating the target; Report shows element shape, surrounding nodes, script/CSS URLs and resource timing. Record → perform a real operation → reopen AI if needed → Stop (same button) captures bounded click/mutation/error/visibility evidence plus resource timing. DevTools opens Eruda (its network visibility depends on execution realm and when initialized). The custom report is not a full network trace. Preview and copy evidence explicitly; no automatic upload. Review URL paths, element IDs, and optional visible text before sending.

**ChatGPT:** enter a question, choose URL only / selected text / page text / diagnostic report, then Prepare → review → Copy → ChatGPT → paste and submit in the desired conversation. Select text before opening the pill; the script retains the last observed selection in this page runtime. Verify the preview matches the intended context. Gemini is also a manual handoff. This uses the existing signed-in application, not an inference API.

**AI-directed investigation:** paste a JSON object from ChatGPT under More → AI investigation plan; Run read-only plan → review and copy the resulting evidence. Example:
```json
{"operations":[{"op":"inspect","selector":"button"},{"op":"sources"},{"op":"resources"}]}
```
Only inspect, controls, sources and resources are allowed, at most eight operations. No arbitrary code, clicks, form submission, credential extraction, or automatic model response retrieval. Review requests and reports before sharing.

**Deferred native inference canary (historical):** create a Shortcut named exactly `AI Pill Ask` with Get Clipboard → Use Model (choose ChatGPT, if available) → Copy to Clipboard → Show Result. Connect your ChatGPT account in Apple Intelligence settings where supported. From the pill prepare and copy a non-sensitive question, then open More → Run Shortcut; verify the model answer and manually paste the clipboard result back into Safari or your conversation. If Use Model is absent, check whether the official ChatGPT app exposes a suitable Shortcuts action; otherwise keep browser handoff. This shortcut is a manual setup recipe, not a distributed signed shortcut or a verified callback. No confidential content in the shortcut URL. [Apple documentation](https://support.apple.com/guide/shortcuts/use-apple-intelligence-in-shortcuts-tpg3vrvwmclv/ios) · [ChatGPT account setup](https://help.openai.com/en/articles/10269382-setting-up-chatgpt-with-apple-intelligence).

**First acceptance:** inspect a real problematic control, record one interaction, send evidence to ChatGPT, run a requested read-only follow-up, and use the returned evidence to make a real userscript improvement. On a second public site test the contextual prompt and Eruda. Native inference shortcut is deferred; test Copy Screenshot instead. If something fails, copy the status/report and note the manager, version and site. JavaScript syntax has been checked; no iPad execution or end-to-end inference has been certified. iSH is deferred.

### Subtractive interface (v0.3.0)

REM-04.01–04.03: a capability earning its existence does not earn a permanent control. Cold demonstration, forgotten-operation return after a week/month, and expert lazy use are the evaluation criteria. Icons replace words when the symbol is recognizable; uncommon tools retain a short label. Preserve 44px touch targets; do not optimize visual density by shrinking interaction targets.

- Default pill: Inspect, Record/Stop, Sources, DevTools, and contextual question preparation. Recording is one stateful action, with a dot on the closed pill.
- Evidence review, Copy and provider links appear only after evidence or a prompt is prepared. Review remains explicit.
- More: Page report, optional element text, read-only AI investigation plan and unverified native Shortcut. No new runtime dependency or automatic inference.
- Sources: search/copy controls appear after successful load; chunk navigation only when needed. Formatting is default; raw toggle is in Source options. Keep file selection and explicit Load because a fetch is not a mere display operation.
- Eruda: compact icons for opacity, height, Sources and close; numeric values remain visible. Accessible names and titles retained.

This is a heuristic utility ranking, not measured adoption. After real use, promote repeated actions, demote unused controls, and remove mechanisms only when their cost exceeds their value. Test a real inspect/record/export flow, close/reopen while recording, and load/search/copy a source; no new target-device acceptance yet.

### Mobile DevTools improvements (v0.2.1)

The first iPad screenshots supplied on November 25 establish that Eruda's Elements and Sources panels actually opened on GitHub. They also establish practical friction: a large opaque panel, difficult small controls, and unformatted source. This is partial target-device evidence, not certification of network capture or the new version.

- **Eruda:** large Opacity, Height, Sources and Close controls appear above the debugger; defaults are 86% opacity and 55% height on fresh settings. Tap to cycle presets. A widened resize hit area supplements Eruda's native control. The duplicate Eruda launcher is hidden; use AI → Eruda to reopen.
- **Sources:** a separate thumb-oriented source browser, reachable directly from AI or the debugger toolbar. Filter actual discovered script and stylesheet names, select a file, Load, toggle Format, search within a file, step through chunks, and review/copy the relevant excerpt with source identity and character offsets. HTML is a fresh document response, not the live DOM. Pretty-printed positions are not original source line numbers.
- Fetches are explicit, ordinary permitted browser requests, not privileged DevTools reads. CORS/CSP or authentication may block them. Limit 2 MiB per file, format up to 1 MiB using pinned [JS Beautifier](https://github.com/beautifier/js-beautify) v1.15.4; larger accepted bundles retain raw search. Nothing is uploaded automatically. Review source excerpts for secrets and private information.
- Upstream source evidence: [Eruda DevTools configuration and resize implementation](https://github.com/liriliri/eruda/blob/v3.4.3/src/DevTools/DevTools.js), [Sources viewer](https://github.com/liriliri/eruda/blob/v3.4.3/src/Sources/Sources.js). v3.4.3 has highlighting but no beautifier in its source viewer and caps raw display at 100,000 characters. Avoid a full Eruda fork; the custom source browser remains separate.

**Acceptance on iPad:** open Eruda on GitHub, cycle opacity/height and close; open Sources, find a JavaScript asset, load it, search for a meaningful term and export a bounded excerpt. Also try Page HTML and Format. If a file cannot be fetched, report the specific error rather than infer the source is inaccessible to every browser tool. New controls and formatter dependencies are not yet target-device tested.

## Living capability atlas

[**capabilities.json**](capabilities.json) is the canonical, evolving inventory of capabilities and realistic workflows. It records human intentions, why each capability matters, candidate mechanisms, dependencies, evidence status, practical acceptance criteria and whether it should remain discoverable and useful after a week or month. It is not a feature commitment or a personal data store.

The initial high-priority surfaces are the existing AssistiveTouch screenshot gesture and screenshot-to-intelligence handoff, native voice control and semantic DOM execution, source-linked capture and investigation resumption (Kami/FKEN), and portable local data handoff through Pocket; iSH is deferred. [Apple Shortcuts research](research/APPLE_SHORTCUTS.md) covers native orchestration and ambient intelligence. Develop from actual recurring workflows, not from an exhaustive API catalog. Preserve the existing fast paths.

## Personal interfaces: a collection of site-specific userscripts

A major component of AI Pill OS is **not** the universal AI pill. It is a collection of specialized Tampermonkey/Userscripts interfaces for the websites the human repeatedly uses. A website is a source of capabilities and information; its stock interface need not be the best way to access them.

Design around the actual distribution of recurring activities: remove low-value features and distractions, increase useful information density, eliminate repeated navigation, expose missing operations at their point of use, and repair recurring friction. Use ordinary deterministic code for familiar interactions. AI is often most useful at **design time**, producing and revising these interfaces, rather than at runtime.

Existing examples in [Learning Visualizations Taxonomy](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy):

- [LinkedIn Insight Mode](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/LinkedIn_Intuit.user.js): reversible subtraction of distracting feed signals and grid presentation.
- [Patent Card](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Patent.Card.user.js): scannable search results and inline detail.
- [PatentX](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/PatentX.user.js): visual relationships and annotation within the document.
- [Kami/Wikipedia](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Kami_Wikipedia.user.js): active investigation, passages, insights and source navigation.
- [YouTube Comments](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Youtube_Comments.user.js): direct filtered access to comments.
- [Grokipedia correction](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Grok_Wikipedia_Correction.user.js): mathematical rendering repair.

Keep canonical scripts in their existing projects; the `site_scripts` index in [capabilities.json](capabilities.json) records their purpose and links. Do not rewrite them to fit a common framework. Introduce shared command or diagnostic primitives only when repeated real usage establishes their value. Preserve a recoverable stock view and validate real tasks on iPad Safari. The goal is to make the right action obvious and almost instantaneous even a week after the last use.

## First practical realization: Safari on iPadOS

A small, movable AI pill on permitted webpages, accessible through touch and native dictation.

Open the pill, express an intention, optionally include selected text or page context, and choose an available intelligence provider. Ideally the answer returns to the current page and, where appropriate, can inform a local browser action.

The first problem is not building a universal browser agent. It is determining whether intelligence from existing ChatGPT Plus and Gemini Pro subscriptions can be made callable from the browser with sufficiently little friction.

### Minimal interface

```text
             [ AI ]
                |
    What do you want to know or do?
    [................................]
    Context: None / Selection / Page
    Provider: ChatGPT / Gemini
                              [ Ask ]
    Status                  [ Details ]
```

Show the provider choices that actually work. Keep diagnostic details and copyable reports available without filling the ordinary interface. Use iPad dictation before building a speech recognition system.

## Functional intent and factorization

Separate three capabilities:

| Capability | Responsibility |
|---|---|
| Perception | Obtain relevant page state, selected content or available controls. |
| Intelligence | Interpret context and intention, answer questions or propose actions. |
| Execution | Present results or perform validated actions in the browser. |

The initial functional contract is simply:

```text
ask(context, intention) -> response
```

A later extension, justified by demonstrated utility:

```text
ask(context, intention, available_actions) -> proposed_actions
```

The provider and its transport are replaceable implementation choices. Known operations need not invoke an AI at all. Do not require a universal workflow engine, backend, new persistence system or general browser automation framework to prove the first contract.

## First investigation: the inference transport

**Q0. Can a real request from Safari reach a supported intelligence provider and return a usable result to the originating webpage?**

| Candidate | What to establish | Status |
|---|---|---|
| Apple Shortcuts / ChatGPT | Can an available model action receive text and return a response to Safari? Does it require Apple Intelligence or foreground interaction? | Unverified on target iPad |
| Sign in with ChatGPT | Can an eligible application use official subscription inference, and what companion runtime or OAuth infrastructure is required? | Eligibility and iPad integration unverified |
| Gemini developer API | Can a separately provisioned key provide a low-cost reference transport? | Separate quota/billing; not inherited from Gemini Pro |
| Explicit browser handoff | Can a prompt be transferred to the existing authenticated ChatGPT or Gemini interface, with a user-controlled return? | Immediate fallback candidate; not an autonomous API |

Prefer supported mechanisms. Do not treat consumer web sessions as unrestricted inference APIs or automate extraction in violation of provider terms. Do not expose OAuth tokens, API keys, or unrelated page contents in diagnostics or URL parameters.

References: [Apple Shortcuts URL schemes](https://support.apple.com/guide/shortcuts/run-a-shortcut-from-a-url-apd624386f42/ios), [Sign in with ChatGPT](https://developers.openai.com/siwc), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Safari Userscripts](https://github.com/quoid/userscripts).

## Coal-mine canary

Begin with one versioned userscript and only the companion components that the chosen transport actually requires.

1. On a real Wikipedia page in Safari, enter a contextual question.
2. Send the prompt through one supported transport.
3. Receive and display the corresponding real model response on the originating page.
4. Export a compact report of the stages reached, elapsed times, and any obstruction.

This certifies the actual inference loop, not merely that a button works or a simulated response can render. A manual handoff is useful but must be labeled separately from a verified automatic return. If a transport fails, identify the failed boundary (authentication, invocation, inference, callback, tab lifecycle, or rendering) and decide whether to repair, substitute, or abandon it.

After the first real success, test switching tabs, refreshing, and using a second domain. Then consider one reversible browser action, such as opening a relevant link. Consequential actions and sensitive data transfers require appropriate user authorization. No hidden retries or duplicate submissions.

## Existing foundations

Reuse proven components and lessons rather than rebuilding the ecosystem:

| Project | Relevance |
|---|---|
| [Logical Cloud](https://github.com/JadanPoll/Logical_Cloud) | Human intention, functional contracts, replaceable computation and evidence. |
| [LabX](https://github.com/JadanPoll/LabX) | Browser adapters, task identity, conversation attribution, failure handling; not a reason to reproduce its local hub or unsupported automation. |
| [Gig Economics](https://github.com/JadanPoll/gig_economics) | Inspectable JSON handoff and low-infrastructure workflows. |
| [Kami Reading Companion](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Kami_Wikipedia.user.js) | Contextual browser augmentation and cross-domain userscript storage. |
| [Microsoft](https://github.com/JadanPoll/microsoft) | Real-device canaries, visible lifecycle, copyable diagnostics. |
| [Fire Console](https://github.com/JadanPoll/fire) | Human-facing interaction decoupled from execution placement. |

## Engineering and investigation method

- [REM](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Navigationals/The_Richer_Engineering_Method.md): recover the holistic goal (REM-01/02), test consequential real flows (REM-03), optimize human-facing utility over time and expose failures (REM-04).
- [RSM](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Navigationals/The_Richer_Scientific_Method.md): factor the question (RSM-02/03), investigate alternative mechanisms and revise beliefs from evidence (RSM-04), preserve the useful investigation trajectory (RSM-05/06).
- [FKEN](https://github.com/JadanPoll/Learning_Visualizations_Taxonomy/blob/main/Navigationals/Fractal_Knowledge_And_Ecosystem_Navigation.md): discover existing implementations and capabilities rather than unnecessarily inventing them.

Judge progress by the total human effort from intention to useful outcome, including context reconstruction, waiting, corrections and recovery. A faster individual operation can still make the overall workflow worse.

## Current status

Vision, capability atlas, and a first browser userscript are committed. No automatic inference transport or iPad acceptance has yet been demonstrated in this repository. The first implementation is an inference canary, not a complete operating system.
