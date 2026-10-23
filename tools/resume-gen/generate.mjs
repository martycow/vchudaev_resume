#!/usr/bin/env node
// Resume generator: Resume_<Role>.md -> PDF (headless Chrome) + DOCX (docx package).
// Usage:
//   node generate.mjs <resume.md> [--preset classic|modern|compact] [--pdf] [--docx]
//                     [--out-dir DIR] [--font-body NAME] [--font-heading NAME] [--accent #hex]
//                     [--html]            keep the intermediate HTML next to the outputs
//   node generate.mjs --check [resume.md]  report whether PDF/DOCX are older than the .md
// With neither --pdf nor --docx both are produced. Output basename = input basename.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

// ---------------------------------------------------------------- CLI
const argv = process.argv.slice(2);
const opts = { preset: 'classic', pdf: false, docx: false, html: false, check: false, outDir: null, overrides: {} };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  if (a === '--preset') opts.preset = next();
  else if (a === '--pdf') opts.pdf = true;
  else if (a === '--docx') opts.docx = true;
  else if (a === '--html') opts.html = true;
  else if (a === '--check') opts.check = true;
  else if (a === '--out-dir') opts.outDir = next();
  else if (a === '--font-body') opts.overrides.fontBody = next();
  else if (a === '--font-heading') opts.overrides.fontHeading = next();
  else if (a === '--accent') opts.overrides.colorAccent = next();
  else if (a === '--font-size') opts.overrides.fontSizePt = Number(next());
  else if (a === '--margin') opts.overrides.pageMarginIn = Number(next());
  else if (a.startsWith('--')) die(`Unknown option ${a}`);
  else positional.push(a);
}
if (!opts.pdf && !opts.docx) opts.pdf = opts.docx = true;

function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

const inputs = positional.length ? positional : fs.readdirSync(repoRoot).filter(f => /^Resume_.*\.md$/.test(f)).map(f => path.join(repoRoot, f));
if (!inputs.length) die('no Resume_*.md found');

if (opts.check) {
  let stale = 0;
  for (const md of inputs) {
    const base = md.replace(/\.md$/, '');
    for (const ext of ['.pdf', '.docx']) {
      const out = base + ext;
      if (!fs.existsSync(out)) { console.log(`MISSING  ${path.basename(out)}`); stale++; continue; }
      const older = fs.statSync(out).mtimeMs < fs.statSync(md).mtimeMs;
      console.log(`${older ? 'STALE   ' : 'ok      '} ${path.basename(out)}`);
      if (older) stale++;
    }
  }
  process.exit(stale ? 2 : 0);
}

// ---------------------------------------------------------------- preset
const presetPath = path.join(here, 'presets', `${opts.preset}.json`);
if (!fs.existsSync(presetPath)) die(`preset not found: ${presetPath}`);
const preset = { ...JSON.parse(fs.readFileSync(presetPath, 'utf8')), ...opts.overrides };

// ---------------------------------------------------------------- inline markdown
// Tokens: {t:'text'|'bold'|'italic'|'bolditalic'|'link', v, href}
function parseInline(s) {
  const out = [];
  const re = /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(?!\s)(.+?)\*)|(\[([^\]]+)\]\(([^)]+)\))|(<([^>\s]+@[^>\s]+)>)|(<(https?:\/\/[^>\s]+)>)/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
    if (m[1]) out.push({ t: 'bolditalic', v: m[2] });
    else if (m[3]) out.push({ t: 'bold', v: m[4] });
    else if (m[5]) out.push({ t: 'italic', v: m[6] });
    else if (m[7]) out.push({ t: 'link', v: m[8], href: m[9] });
    else if (m[10]) out.push({ t: 'link', v: m[11], href: `mailto:${m[11]}` });
    else if (m[12]) out.push({ t: 'link', v: m[13], href: m[13] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
  return out;
}
const plain = s => parseInline(s).map(t => t.v).join('');

// ---------------------------------------------------------------- document model
// Structure expected (see Resume_Gameplay_Engineer.md):
//   **Name** / Title / contact line / note lines
//   **SECTION**  (all caps, bold)   then section-specific lines
function parseResume(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, ''));
  const doc = { name: '', title: '', contact: '', notes: [], sections: [] };
  const isHeading = l => /^\*\*[A-Z][A-Z0-9 &\/\-]+\*\*$/.test(l.trim());
  let i = 0;
  const skip = () => { while (i < lines.length && !lines[i].trim()) i++; };
  skip(); doc.name = plain(lines[i++]); skip(); doc.title = plain(lines[i++]); skip(); doc.contact = lines[i++];
  skip();
  while (i < lines.length && !isHeading(lines[i])) { if (lines[i].trim()) doc.notes.push(lines[i]); i++; }

  let section = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) continue;
    if (isHeading(l)) {
      const title = plain(l).trim();
      if (/CONTINUED/i.test(title)) continue; // page-break artifact, not content
      section = { title, kind: kindOf(title), paragraphs: [], rows: [], entries: [], bullets: [] };
      doc.sections.push(section);
      continue;
    }
    if (!section) continue;
    if (section.kind === 'skills') {
      const m = l.match(/^\*\*(.+?)\*\*\s{2,}(.+)$/);
      if (m) section.rows.push({ label: m[1], value: m[2] }); else section.paragraphs.push(l);
    } else if (section.kind === 'experience') {
      parseExperienceLine(section, l);
    } else if (/^[*-]\s+/.test(l)) {
      section.bullets.push(l.replace(/^[*-]\s+/, ''));
    } else {
      section.paragraphs.push(l);
    }
  }
  return doc;
}
function kindOf(title) {
  if (/SKILL/i.test(title)) return 'skills';
  if (/EXPERIENCE/i.test(title)) return 'experience';
  if (/EDUCATION/i.test(title)) return 'education';
  if (/LANGUAGE/i.test(title)) return 'languages';
  return 'text';
}
function parseExperienceLine(section, l) {
  const entries = section.entries;
  const cur = entries[entries.length - 1];
  const bullet = l.match(/^[*-]\s+(.*)$/);
  if (bullet) {
    if (!cur) return;
    const target = cur.subs.length ? cur.subs[cur.subs.length - 1] : cur;
    target.bullets.push(bullet[1]);
    return;
  }
  // **Company**    dates   (two or more spaces between)
  const company = l.match(/^\*\*(.+?)\*\*\s{2,}(.+)$/);
  if (company && !/\|/.test(l)) {
    entries.push({ company: company[1], dates: company[2], role: '', location: '', project: '', projectDesc: '', bullets: [], subs: [] });
    return;
  }
  if (!cur) return;
  // **Project**  |  description  OR  **Sub (dates)**  |  description
  const proj = l.match(/^\*\*(.+?)\*\*\s*\|\s*(.+)$/);
  if (proj) {
    if (!cur.project && !cur.subs.length) { cur.project = proj[1]; cur.projectDesc = proj[2]; }
    else cur.subs.push({ title: proj[1], desc: proj[2], bullets: [] });
    return;
  }
  // **Earlier work (2015–2018):**
  const sub = l.match(/^\*\*(.+?):?\*\*$/);
  if (sub) { cur.subs.push({ title: sub[1].replace(/:$/, ''), desc: '', bullets: [] }); return; }
  // Role  |  Location   (first non-bold line after company)
  if (!cur.role) {
    const [role, loc] = l.split(/\s*\|\s*/);
    cur.role = role.trim(); cur.location = (loc || '').trim();
    return;
  }
  (cur.subs.length ? cur.subs[cur.subs.length - 1] : cur).bullets.push(l);
}

// ---------------------------------------------------------------- HTML
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function inlineHtml(s) {
  return parseInline(s).map(t => {
    const v = esc(t.v);
    switch (t.t) {
      case 'bold': return `<b>${v}</b>`;
      case 'italic': return `<i>${v}</i>`;
      case 'bolditalic': return `<b><i>${v}</i></b>`;
      case 'link': return `<a href="${esc(t.href)}">${v}</a>`;
      default: return v;
    }
  }).join('');
}
function toHtml(doc, p) {
  const h = [];
  h.push(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.name)} - ${esc(doc.title)}</title><style>
@page { size: Letter; margin: ${p.pageMarginIn}in; }
html, body { margin: 0; padding: 0; }
body { font-family: "${p.fontBody}", Arial, sans-serif; font-size: ${p.fontSizePt}pt; line-height: ${p.lineHeight}; color: ${p.colorText}; }
a { color: inherit; text-decoration: none; }
.name { font-family: "${p.fontHeading}", serif; font-size: ${p.nameSizePt}pt; font-weight: 700; color: ${p.colorAccent}; letter-spacing: 0.5px; margin: 0; }
.title { font-size: ${p.fontSizePt + 2.5}pt; color: ${p.colorMuted}; margin: 2pt 0 4pt; }
.contact { color: ${p.colorMuted}; margin: 0 0 2pt; }
.note { color: ${p.colorMuted}; font-size: ${p.fontSizePt - 0.5}pt; margin: 0; }
h2 { font-family: "${p.fontHeading}", serif; font-size: ${p.headingSizePt}pt; color: ${p.colorAccent}; margin: 11pt 0 4pt; padding-bottom: 2pt;
     border-bottom: 1px solid ${p.colorRule}; ${p.headingStyle === 'caps-rule' ? 'letter-spacing: 1.5px;' : 'letter-spacing: 0.8px;'} text-transform: uppercase; break-after: avoid; }
p { margin: 0 0 4pt; }
.skills { display: grid; grid-template-columns: 18% 1fr; column-gap: 8pt; row-gap: 2pt; }
.skills .label { font-weight: 700; color: ${p.colorAccent}; }
.skills-inline p { margin: 0 0 1.5pt; }
.skills-inline b { color: ${p.colorAccent}; }
.entry { margin: 0 0 7pt; break-inside: avoid; }
.entry-head { display: flex; justify-content: space-between; align-items: baseline; }
.company { font-weight: 700; font-size: ${p.fontSizePt + 1}pt; }
.dates { color: ${p.colorMuted}; white-space: nowrap; }
.role { color: ${p.colorMuted}; margin: 0; }
.project { margin: 1pt 0 2pt; }
.project b { color: ${p.colorAccent}; }
.sub { margin: 4pt 0 1pt; }
ul { margin: 1pt 0 0 0; padding-left: 14pt; }
li { margin: 0 0 1.5pt; }
.edu { display: flex; justify-content: space-between; }
</style></head><body>`);
  h.push(`<p class="name">${esc(doc.name)}</p><p class="title">${esc(doc.title)}</p><p class="contact">${inlineHtml(doc.contact)}</p>`);
  for (const n of doc.notes) h.push(`<p class="note">${inlineHtml(n)}</p>`);
  for (const s of doc.sections) {
    h.push(`<h2>${esc(s.title)}</h2>`);
    if (s.kind === 'skills') {
      if (p.skillsLayout === 'table') {
        h.push('<div class="skills">' + s.rows.map(r => `<div class="label">${inlineHtml(r.label)}</div><div>${inlineHtml(r.value)}</div>`).join('') + '</div>');
      } else {
        h.push('<div class="skills-inline">' + s.rows.map(r => `<p><b>${inlineHtml(r.label)}:</b> ${inlineHtml(r.value)}</p>`).join('') + '</div>');
      }
      for (const para of s.paragraphs) h.push(`<p>${inlineHtml(para)}</p>`);
    } else if (s.kind === 'experience') {
      for (const e of s.entries) {
        h.push(`<div class="entry"><div class="entry-head"><span class="company">${inlineHtml(e.company)}</span><span class="dates">${inlineHtml(e.dates)}</span></div>`);
        h.push(`<p class="role">${esc(e.role)}${e.location ? ` &nbsp;|&nbsp; ${esc(e.location)}` : ''}</p>`);
        if (e.project) h.push(`<p class="project"><b>${inlineHtml(e.project)}</b> &nbsp;|&nbsp; ${inlineHtml(e.projectDesc)}</p>`);
        if (e.bullets.length) h.push('<ul>' + e.bullets.map(b => `<li>${inlineHtml(b)}</li>`).join('') + '</ul>');
        for (const sub of e.subs) {
          h.push(`<p class="sub project"><b>${inlineHtml(sub.title)}</b>${sub.desc ? ` &nbsp;|&nbsp; ${inlineHtml(sub.desc)}` : ':'}</p>`);
          if (sub.bullets.length) h.push('<ul>' + sub.bullets.map(b => `<li>${inlineHtml(b)}</li>`).join('') + '</ul>');
        }
        h.push('</div>');
      }
    } else {
      for (const para of s.paragraphs) {
        // "***RTU MIREA***  |  degree   2012–2016" -> left/right split on 3+ spaces
        const m = para.match(/^(.*\S)\s{3,}(\S.*)$/);
        if (s.kind === 'education' && m) h.push(`<p class="edu"><span>${inlineHtml(m[1])}</span><span class="dates">${inlineHtml(m[2])}</span></p>`);
        else h.push(`<p>${inlineHtml(para)}</p>`);
      }
      if (s.bullets.length) h.push('<ul>' + s.bullets.map(b => `<li>${inlineHtml(b)}</li>`).join('') + '</ul>');
    }
  }
  h.push('</body></html>');
  return h.join('\n');
}

// ---------------------------------------------------------------- PDF via headless Chrome
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find(c => fs.existsSync(c)) || die('Chrome/Edge not found; set CHROME_PATH');
}
function htmlToPdf(htmlPath, pdfPath) {
  const chrome = findChrome();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-gen-'));
  const url = 'file:///' + htmlPath.replace(/\\/g, '/');
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', '--print-to-pdf-no-header',
    `--print-to-pdf=${pdfPath}`, url,
  ], { stdio: 'ignore', timeout: 60000 });
  fs.rmSync(profile, { recursive: true, force: true });
}

// ---------------------------------------------------------------- DOCX
async function toDocx(doc, p, outPath) {
  const docx = await import('docx');
  const { Document, Packer, Paragraph, TextRun, ExternalHyperlink, TabStopType, AlignmentType, BorderStyle, Header, Footer, PageNumber, LevelFormat, Table, TableRow, TableCell, WidthType } = docx;
  const sz = pt => Math.round(pt * 2); // half-points
  const hex = c => c.replace('#', '');
  const PAGE_W = 12240, MARGIN = Math.round(p.pageMarginIn * 1440), CONTENT_W = PAGE_W - 2 * MARGIN;

  const runs = (s, base = {}) => parseInline(s).map(t => {
    const o = { text: t.v, font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorText), ...base };
    if (t.t === 'bold') o.bold = true;
    if (t.t === 'italic') o.italics = true;
    if (t.t === 'bolditalic') { o.bold = true; o.italics = true; }
    if (t.t === 'link') return new ExternalHyperlink({ link: t.href, children: [new TextRun({ ...o, style: 'Hyperlink' })] });
    return new TextRun(o);
  });
  const para = (children, extra = {}) => new Paragraph({ children, spacing: { after: 60, line: Math.round(p.lineHeight * 240) }, ...extra });
  const heading = title => new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, font: p.fontHeading, size: sz(p.headingSizePt), color: hex(p.colorAccent), characterSpacing: 20 })],
    spacing: { before: 200, after: 60 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(p.colorRule), space: 2 } },
  });
  const leftRight = (leftRuns, rightRuns, extra = {}) => new Paragraph({
    children: [...leftRuns, new TextRun({ text: '\t' }), ...rightRuns],
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    spacing: { after: 20 }, ...extra,
  });
  const bullet = s => new Paragraph({ children: runs(s), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 30, line: Math.round(p.lineHeight * 240) } });
  const muted = { color: hex(p.colorMuted) };

  const body = [];
  body.push(new Paragraph({ children: [new TextRun({ text: doc.name, bold: true, font: p.fontHeading, size: sz(p.nameSizePt), color: hex(p.colorAccent) })], spacing: { after: 20 } }));
  body.push(para([new TextRun({ text: doc.title, font: p.fontBody, size: sz(p.fontSizePt + 2.5), color: hex(p.colorMuted) })], { spacing: { after: 60 } }));
  body.push(para(runs(doc.contact, muted), { spacing: { after: 20 } }));
  for (const n of doc.notes) body.push(para(runs(n, { ...muted, size: sz(p.fontSizePt - 0.5) })));

  for (const s of doc.sections) {
    body.push(heading(s.title));
    if (s.kind === 'skills') {
      if (p.skillsLayout === 'table') {
        const labelW = Math.round(CONTENT_W * 0.18);
        body.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [labelW, CONTENT_W - labelW],
          borders: noBorders(BorderStyle),
          rows: s.rows.map(r => new TableRow({ children: [
            new TableCell({ width: { size: labelW, type: WidthType.DXA }, borders: noBorders(BorderStyle), children: [para([new TextRun({ text: plain(r.label), bold: true, font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorAccent) })], { spacing: { after: 20 } })] }),
            new TableCell({ width: { size: CONTENT_W - labelW, type: WidthType.DXA }, borders: noBorders(BorderStyle), children: [para(runs(r.value), { spacing: { after: 20 } })] }),
          ] })),
        }));
      } else {
        for (const r of s.rows) body.push(para([new TextRun({ text: plain(r.label) + ': ', bold: true, font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorAccent) }), ...runs(r.value)], { spacing: { after: 20 } }));
      }
      for (const t of s.paragraphs) body.push(para(runs(t)));
    } else if (s.kind === 'experience') {
      for (const e of s.entries) {
        body.push(leftRight([new TextRun({ text: plain(e.company), bold: true, font: p.fontBody, size: sz(p.fontSizePt + 1), color: hex(p.colorText) })], runs(e.dates, muted), { spacing: { before: 80, after: 20 }, keepNext: true }));
        body.push(para([new TextRun({ text: e.role + (e.location ? `  |  ${e.location}` : ''), font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorMuted) })], { spacing: { after: 20 }, keepNext: true }));
        if (e.project) body.push(para([new TextRun({ text: plain(e.project), bold: true, font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorAccent) }), new TextRun({ text: '  |  ', font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorMuted) }), ...runs(e.projectDesc)], { spacing: { after: 40 }, keepNext: true }));
        for (const b of e.bullets) body.push(bullet(b));
        for (const sub of e.subs) {
          body.push(para([new TextRun({ text: plain(sub.title), bold: true, font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorAccent) }), ...(sub.desc ? [new TextRun({ text: '  |  ', font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorMuted) }), ...runs(sub.desc)] : [new TextRun({ text: ':', font: p.fontBody, size: sz(p.fontSizePt) })])], { spacing: { before: 60, after: 40 }, keepNext: true }));
          for (const b of sub.bullets) body.push(bullet(b));
        }
      }
    } else {
      for (const t of s.paragraphs) {
        const m = t.match(/^(.*\S)\s{3,}(\S.*)$/);
        if (s.kind === 'education' && m) body.push(leftRight(runs(m[1]), runs(m[2], muted)));
        else body.push(para(runs(t)));
      }
      for (const b of s.bullets) body.push(bullet(b));
    }
  }

  const d = new Document({
    creator: doc.name, title: `${doc.name} - ${doc.title}`, description: 'Generated by tools/resume-gen from Markdown source',
    styles: { default: { document: { run: { font: p.fontBody, size: sz(p.fontSizePt), color: hex(p.colorText) } } },
      characterStyles: [{ id: 'Hyperlink', name: 'Hyperlink', basedOn: 'DefaultParagraphFont', run: { color: hex(p.colorText), underline: {} } }] },
    numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
      headers: { default: new Header({ children: [leftRight([new TextRun({ text: doc.name.toUpperCase(), bold: true, size: sz(p.fontSizePt - 1), color: hex(p.colorMuted) })], [new TextRun({ text: doc.title, size: sz(p.fontSizePt - 1), color: hex(p.colorMuted) })])] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], size: sz(p.fontSizePt - 1), color: hex(p.colorMuted) })] })] }) },
      children: body,
    }],
  });
  fs.writeFileSync(outPath, await Packer.toBuffer(d));
}
function noBorders(BorderStyle) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
}

// ---------------------------------------------------------------- main
for (const mdPath of inputs) {
  const abs = path.resolve(mdPath);
  if (!fs.existsSync(abs)) die(`not found: ${abs}`);
  const doc = parseResume(fs.readFileSync(abs, 'utf8'));
  const base = path.basename(abs, '.md');
  const outDir = opts.outDir ? path.resolve(opts.outDir) : path.dirname(abs);
  fs.mkdirSync(outDir, { recursive: true });
  const html = toHtml(doc, preset);
  const htmlPath = path.join(opts.html ? outDir : os.tmpdir(), `${base}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`${base}: preset=${preset.name}, ${doc.sections.length} sections, ${doc.sections.filter(s => s.kind === 'experience').flatMap(s => s.entries).length} experience entries`);
  if (opts.pdf) { const out = path.join(outDir, `${base}.pdf`); htmlToPdf(htmlPath, out); console.log(`  wrote ${path.relative(repoRoot, out)} (${fs.statSync(out).size} bytes)`); }
  if (opts.docx) { const out = path.join(outDir, `${base}.docx`); await toDocx(doc, preset, out); console.log(`  wrote ${path.relative(repoRoot, out)} (${fs.statSync(out).size} bytes)`); }
  if (!opts.html) fs.rmSync(htmlPath, { force: true });
}
