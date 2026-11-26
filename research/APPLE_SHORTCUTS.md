# Apple Shortcuts as an AI-directed system layer

2026-11-25 — research, not target-device acceptance.

## Goal

AI Pill OS asks whether a person can operate asymptotically at the speed of thought. The browser pill is one surface; the native OS's exposed actions, events, and displays are another. The lock screen example is a specific instance of AI-curated ambient information rather than a requirement for a literal screensaver.

## Critical generating set of existing implementations

| Source | Capability to learn from |
|---|---|
| [Federico Viticci / S-GPT](https://www.macstories.net/ios/introducing-s-gpt-a-shortcut-to-connect-openais-chatgpt-with-native-features-of-apples-operating-systems/) | ChatGPT conversation with clipboard, Safari, Calendar, Reminders, Music and export integrations; original uses a separately billed API key. |
| [MacStories archive](https://www.macstories.net/Shortcuts/) and [Automation April winners](https://www.macstories.net/stories/introducing-the-2023-automation-april-shortcuts-contest-winners/) | Population of creative compositional workflows, including system actions and contextual activation. |
| [Matthew Cassinelli](https://matthewcassinelli.com/library/) | Broad action/app/automation catalog; former Workflow/Shortcuts team member. |
| [Simon Støvring / Scriptable](https://scriptable.app/) and [Data Jar](https://apps.apple.com/us/app/data-jar/id1453273600) | Plain JavaScript, image rendering, widgets, URL callback, persistent structured data. |
| [Sindre Sorhus / Actions](https://sindresorhus.com/actions) | Native utility actions, JSON, text transformation, device state, shortcut locking. |
| [Cherri](https://github.com/electrikmilk/cherri), [browser playground](https://playground.cherrilang.org/) | Compile source to runnable Shortcuts; signing still required. [Decompilation](https://cherrilang.org/decompilation) is beta. Particularly valuable for versioned agent-assisted workflows. |
| [Toolbox Pro](https://toolboxpro.app/) / [Pushcut](https://apps.apple.com/us/app/pushcut-shortcuts-automation/id1450936447?platform=ipad) | Expanded actions and notification/webhook delivery. Pushcut's dedicated server mode and paid features have separate constraints. |
| [calendar-lockscreen](https://github.com/OuterCFO/calendar-lockscreen), [dynamic schedule wallpaper](https://github.com/arhs02/IOS-Dyna-Schedule-Wallpaper) | Generate image from data, then install it as wallpaper through Shortcuts. iPhone precedents, not proven on target iPad. |
| [hermes-lockscreen](https://github.com/LemonFace0309/hermes-lockscreen) | AI-agent chat rendered as a Messages-like lock-screen image and updated on received-message events. Strong analogy, not a dependency. |

## Factorization

Event / intention -> permitted context -> model or deterministic routing -> validated action / rendering -> visible result.

- Inputs: Siri, dictation, share sheet, app open/close, time, Focus, charger, and supported app data.
- Intelligence: native Use Model (eligible Apple Intelligence hardware, model/usage limits), API, local logic, or explicit consumer-app handoff.
- Outputs: widget, wallpaper, notification, speech, file, supported App Intent, browser navigation.
- State: start with a single small JSON file; add Data Jar or shared service only if justified.
- Build tooling: manually prove one workflow; investigate Cherri for reproducible source-controlled delivery before building more.

## The ambient intelligence canary

Ask the model to select one useful next question from a small user-curated research context. Return plain text or a bounded JSON object. Render it into an image or widget using Scriptable (or native actions if sufficient). Update one designated wallpaper or Home Screen widget. Do not send private documents or expose sensitive context on a locked device.

Test in order:
1. Native model action exists and returns a genuine answer on this iPad.
2. Deterministic rendering / wallpaper or widget update works on the iPad, independently of inference.
3. Connect the two, run manually, inspect actual display.
4. Run on one time or Focus trigger. Check behavior with locked and unlocked device; if unsupported, keep an explicit refresh.
5. Evaluate whether the result is genuinely useful after repeated daily use, not merely technically successful.

In parallel, the Safari pill can test native share-sheet JavaScript -> Use Model -> output. Apple's Run JavaScript on Webpage action specifically requires the Safari share-sheet invocation; it is not arbitrary system-wide UI control.

## Boundaries and stopping rules

- iPadOS has no documented general system-wide custom screensaver; wallpaper is a static snapshot, widgets are OS-scheduled, and foreground dashboards are distinct.
- [Scriptable widget refresh](https://scriptable.app/docs/reference/listwidget/) is advisory, not guaranteed exact timing.
- [App and settings triggers](https://support.apple.com/guide/shortcuts/setting-triggers-apde31e9638b/ios) exist, but unattended execution of particular actions may require unlock, confirmation, or foreground.
- [Use Model](https://support.apple.com/guide/shortcuts/use-apple-intelligence-in-shortcuts-tpg3vrvwmclv/ios) is supported on eligible devices; no assumption of unrestricted Plus inference, complete chat history access, or continuous microphone/screen monitoring.
- [iPad wallpaper](https://support.apple.com/guide/ipad/ipad997d908e/ipados) supports Focus-linked changes; direct generated-image update must be verified on the target OS and wallpaper type.
- [Share-sheet JavaScript](https://support.apple.com/guide/shortcuts/apd218e2187d/ios), [x-callback-url](https://support.apple.com/guide/shortcuts/apdcd7f20a6f/ios) are distinct transport mechanisms, not automatic proof of reliable Safari return.
- Never let untrusted webpage instructions authorize consequential actions. Use explicit context selection and approval for sensitive external effects.

Do not create a general agent, background daemon, or vast action catalog before a working, useful slice. Source evidence above establishes candidate mechanisms; no target-device tests have yet run.
