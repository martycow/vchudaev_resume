# resume-gen

Generates `Resume_<Role>.pdf` and `Resume_<Role>.docx` from `Resume_<Role>.md`. PDF is printed by headless Chrome/Edge, DOCX is built with the `docx` package, so the two outputs share one parsed model and the same style preset.

## Setup

```bash
cd tools/resume-gen && npm install
```

Needs Node 18+ and Chrome or Edge (set `CHROME_PATH` if neither is in the default location).

## Usage

```bash
node tools/resume-gen/generate.mjs Resume_Gameplay_Engineer.md                 # PDF + DOCX, preset classic
node tools/resume-gen/generate.mjs Resume_Gameplay_Engineer.md --preset modern
node tools/resume-gen/generate.mjs Resume_Gameplay_Engineer.md --pdf --accent "#7c2d12" --font-body Georgia
node tools/resume-gen/generate.mjs --check                                      # exit 2 if any PDF/DOCX is older than its .md
```

Options: `--preset classic|modern|compact`, `--pdf`, `--docx`, `--html` (keep intermediate HTML), `--out-dir`, `--font-body`, `--font-heading`, `--accent`, `--font-size`, `--margin`. With no input file every `Resume_*.md` in the repo root is processed.

## Presets

`presets/*.json`: fonts, sizes, colours, margins, heading style, `skillsLayout` (`inline` is ATS-safe; `table` is a two-column grid). Copy a preset to make a new one.

## Markdown contract

The parser expects the structure of `Resume_Gameplay_Engineer.md`:

- line 1 `**Name**`, then title, then a contact line, then optional note lines;
- sections as bold all-caps lines (`**SUMMARY**`, `**TECHNICAL SKILLS**`, `**EXPERIENCE**`, `**EDUCATION**`, `**LANGUAGES**`);
- skills rows `**Label**  text` (two or more spaces after the label);
- experience entries: `**Company**    dates`, then `Role  |  Location`, then `**Project**  |  description`, then `* bullets`; sub-blocks like `**SuperSCADA (2018–2020)**  |  desc` or `**Earlier work (2015–2018):**` are supported;
- education lines split on three or more spaces into left text and right-aligned dates.

Inline `**bold**`, `*italic*`, `***both***`, `[text](url)` and `<email>` are rendered in both outputs.
