# Handoff for the next AI session

Last updated: 2026-10-18. Written by the previous Claude session after a full exploration of this repo (every text file, every Showcase image, git history, GitHub metadata, DNS).

## What this repo is

Public landing page + resume for Viacheslav Chudaev (Unity gameplay engineer, Portland OR, job hunting for software or game developer roles). `vchudaev.dev` 307-redirects to this GitHub repo, so `README.md` is effectively the personal site. See `AGENTS.md` for the coach role and `INBOX.md` for the owner's wish-list.

## Done in the 2026-10-23 session (uncommitted)

- Resume rewrite (owner-approved): title "Senior" dropped; gap shown as "Relocation to the U.S., June 2024 – September 2025" (owner chose this wording); summary rewritten with 50M+/1M+ downloads and Steam Early Access; skills gained Photon, Zenject, UniTask, Addressables, Tools and AI tooling rows; SuperSCADA and Earlier work compressed; "In-Site" -> "On-site". PDF/DOCX regenerated (preset classic, 2 pages). Store links for Pantheon/BCW2/Combat Quest not added yet (URLs not verified).
- Store links (Steam, Google Play, App Store, MZTA product page) and a Beauty Tycoon block added to the gameplay resume. Links and the Pantheon layoff letter recorded in PROFILE.md.
- New `Resume_Software_Engineer.md/.pdf/.docx`: C#/.NET framing, Cedar Clerk as the first entry (ASP.NET Core .NET 10, EF Core, Angular, Electron, 1,700+ xUnit tests, Playwright, DigitalOcean; owner says it was mostly built with AI agents, the resume says so). README now links both resumes and dropped "Senior" from its title.
- LinkedIn updated from `_Private/LinkedIn_Draft.md` (header of that file lists what was and was not applied): headline (Unity only), About, top skills, career break, Visionary Realms/Ciprosoft/ChillGaming descriptions, MZTA renamed to English on all three roles, Featured resume link first. Owner declined Open to work. Featured resume link points to GitHub, which still shows the old resume until the working tree is committed. Open question: official company names and titles (ChillBase vs ChillGaming LTD, "Unity Developer"; Ciprosoft "Lead Unity Engineer"; MZTA three roles) differ between resume and LinkedIn.
- Later the same day: Ciprosoft title is "Lead Unity Engineer"; Dragon Game = lead and primary developer, Beauty Tycoon = led four programmers (owner: toxic team, little achieved; candidate STAR story for a conflict question). ChillBase shown as "ChillBase (formerly ChillGaming)". MZTA split into three roles with part-time until 2016. "8 years in Unity" corrected to "7+". LinkedIn updated to match (ChillBase company page, title, Ciprosoft line, About). Resumes regenerated after commit 7f014e0, so these edits are uncommitted.
- Tracker: micro1 and hidakota marked `declined` by owner (AI interviews); DataAnnotation assessment kept, owner will try it.
- Target-role advice given: mid-level Unity gameplay/UI/tools at mobile and F2P studios first, Unity outside games second, C#/.NET only with a separate `Resume_Software_Engineer`; avoid AAA core tech, Senior at FAANG-level, duplicates via agencies.

- `.gitignore`: added `_Private`, `.DS_Store`, `node_modules` (`_Private` was NOT ignored before, despite the note below). Owner's pushed commit `e9e0dc3` includes `Showcase/.DS_Store`.
- INBOX 3a done: application tracker. Mail lives in `contact@vchudaev.dev` (delivered to the `contact@mooexe.dev` workspace mailbox); the Gmail connector was reconnected to it. Table: `_Private/applications.md` (40 applications since 2026-09-21, 0 interviews, 3 pending assessments: hidakota, micro1, DataAnnotation).
- Project skill `.claude/skills/track-applications/SKILL.md` re-reads the mailbox for a period and merges into the table. Not yet tested: owner will run `/track-applications` in a new session. Owner said: do not commit yet.
- `Tailored/` (cover letters per company) is untracked and not ignored; ask the owner whether to ignore it.

## Done in the 2026-10-18 session (uncommitted, in working tree)

- `README.md`: fixed the three resume links (old `Resume_2026_Senior_Unity_Gameplay_Engineer.*` -> `Resume_Gameplay_Engineer.*`) and the Dragon Game showcase link (`Dragons Of Krypto` -> `Dragon Game`). All relative links now resolve.
- Removed 11 sensitive screenshots (`git rm`): NewPromotion `Customer Payment Info.PNG` (real client billing data + employee name) and `Customer Dashboard.PNG` (colleague e-mail); Cedar Clerk `User Blog Posts.png` (personal post, children's photo); Pantheon `Steve Comment.png` and `Debugging Server Side.png` (internal chat); Block City Wars 2 `Playtest 1-3.png` + `Playtesr 4.png` (full-desktop captures: Unity Personal title bar, console errors, personal taskbar); KStudio `Player View.jpg` (internal IP, unreadable); KResource `Properties Grid.PNG` (real residential addresses, near-duplicate).
- Stripped EXIF (incl. GPS coordinates) from `Showcase/2015 - USPD/Debugging USPD.jpg` and `Exploring Watermeter KM5.jpg`. Files re-validated as JPEG.
- Rewrote `AGENTS.md` (role, language, repo map, rules). Created git-ignored `_Private/PROFILE.md`: full career knowledge base with [?] gaps and six open questions for the owner. Added `_Private` and `node_modules` to `.gitignore`.
- Built `tools/resume-gen/` (Node, headless Chrome for PDF, `docx` package for DOCX, presets classic/modern/compact). Regenerated `Resume_Gameplay_Engineer.pdf/.docx` from the `.md` with preset classic; the Google Docs exports are replaced. Removed the `**EXPERIENCE / CONTINUED**` page-break artifact from the `.md`.
- Owner decisions this session: proposed order (AGENTS -> profile -> generator -> e-mail tracker -> site -> TUI tool) approved; CowWorker is considered outdated, prefer Claude-based workflows.
- `AGENTS.md`, `INBOX.md`, `HANDOFF.md`, `tools/` are still untracked. Nothing has been committed or pushed.

## Known facts that are NOT visible from the current tree

- **Git history still contains the owner's personal phone number and personal Gmail** (old resume files `Unity Resume*.md`, `Unity Engineer Resume.*`, commits before `6547254`). Removed screenshots also remain in history. Only a history rewrite (e.g. `git filter-repo` + force push) removes them; the owner must decide.
- **Before 2026-10-18 the PDF/DOCX were Google Docs exports, not generated from the .md.** (Now regenerated by tools/resume-gen; old note kept for history.) The DOCX embeds the Google Doc ID in `customXML/item1.xml`; PDF Title metadata still says `Resume_2026_Senior_Unity_Gameplay_Engineer.docx`. They are older than the .md and differ (project name "Dragons of Crypto" vs "Dragon Game", "Chillbase" vs "ChillBase", education dates). No generator toolchain on this machine: no pandoc/LibreOffice/typst; Node 22, cargo, Chrome/Edge are available.
- Commits were authored under three e-mails (contact@vchudaev.dev, a Gmail, cedarworks@mooexe.dev). GitHub profile `martycow`: 8 public repos incl. `CowWorker` (Rust job-hunting app, overlaps INBOX items 3a/6/7/8), `tetro-ultra` (ratatui), `Interview_Task_Graphs` (matches `Showcase/Unity - General`), `CedarClerk`, `CedarStation`. Profile website points to `martycow.cedarclerk.app`, company "Moo.exe".
- Domain has SPF but apparently no DMARC TXT record.
- Repo: ~120 MB pack, no LICENSE, no topics, Issues/Wiki/Projects tabs enabled and empty.

## Open findings (155 confirmed in total; the rest are below)

High / medium, still open:
- Resume header says "Senior" but no listed role was Senior; "11 years" spans a 15-month gap (Jun 2024 - Sep 2025).
- `.md` quality: `**EXPERIENCE / CONTINUED**` page-break artifact (line ~52); "| In-Site" should be "On-site"; UI skills line "...implementation pixel perfect" is broken; Angular bullet ends with a comma; README skills list Unreal/C++/TypeScript/Rust/Swift/Qt with no evidence in resume or Showcase.
- Showcase still containing debatable items (owner's call): `Pantheon/Creating Ability.png` (studio's internal node tool), `USPD/Writing Driver for heatmeter SA94.jpg` (legible employer code), whole `2022 - Dragon Game` folder (unreleased client prototype, confirm NDA), `Unity - General/Some of Interview Tasks.png` (orphan, not linked from README).
- Filename typos: `Explogin KOmega...`, `Connecting to Electrometer Pulsar230.JPG` (device is a Mercury 230), `Tennant Services.PNG`, `Main Manu.PNG`, `Climing On Slope.png`, `Fixing Network Physics Issie 1/2.png`, `Twitter Intergration.png`, `Cedar Clerk .png` (trailing space), `Game OverScreen.PNG`, SuperScada `FBD Editor 2.PNG` is actually the LD editor and duplicates `LD Editor.PNG`.
- Quality: USPD photos 2-6 MB each (28 MB folder); `Installing and Checking USPD for Customer.JPG` is too dark; KStudio `Workflow.jpg` 628x487 unreadable; Cedar Clerk ultrawide captures illegible at preview size; Combat Quest `Gameplay.jpg`/`NPC.jpg` low-res with App Store back-link; Dragon Game `Inventory.png` shows a text-overflow bug.
- No README/captions inside any Showcase folder; nothing embedded in root README; USPD/Skolkovo/MIREA/FBD-LD-ST need one-clause glosses for US recruiters; no store/Steam links for shipped titles; App Store link uses the `ae` storefront.

Full machine-readable list from the audit: session scratchpad `final_summary.txt` (may be gone; regenerate by re-auditing if needed).

## Suggested next steps, in order

1. Review the working-tree changes, commit them (suggested message: "Fix README links, remove sensitive screenshots, strip GPS EXIF").
2. Decide on git history rewrite for the phone number / Gmail; if yes, `git filter-repo` and force-push, then re-clone.
3. Rename typo'd Showcase files; add a short `README.md` per Showcase folder with captions; downscale USPD photos.
4. Fix `.md` text issues above, then run `node tools/resume-gen/generate.mjs` (generator exists now; `--check` reports staleness). Next INBOX item: application tracker fed from Gmail (connector is available), then portfolio site, then TUI tool.
5. Rewrite the first screen of `README.md` so the summary pitch and shipped-title links come first.
6. Second resume variant `Resume_Software_Engineer.*` (AGENTS.md anticipates `Resume_<Role>` files).

## Working notes for the AI

- Repo owner reads Russian; respond in Russian, keep file contents in English.
- Do not quote the personal phone number anywhere; do not commit/push unless asked.
- A large multi-agent fan-out (hundreds of agents) hit the account's spend limit on 2026-10-18; keep verification batched.
