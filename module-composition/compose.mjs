// FinCoach Module Composition Framework · Generator
// Erzeugt ein vollständiges, eigenständiges Modul-HTML aus Katalog + Manifest + Block-Partials.
// Aufruf:  node module-composition/compose.mjs module-composition/<manifest>.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const manifestArg = process.argv[2];
if (!manifestArg) { console.error('Usage: node compose.mjs <manifest.json>'); process.exit(1); }

const catalog = JSON.parse(fs.readFileSync(path.join(DIR, 'blocks-catalog.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.resolve(manifestArg), 'utf8'));
const catById = Object.fromEntries(catalog.blocks.map(b => [b.id, b]));

const used = (manifest.blocks || []).filter(b => b.enabled !== false);

// Pflicht-Check (required dürfen nicht fehlen)
const required = catalog.blocks.filter(b => b.required).map(b => b.id);
const present = used.map(b => b.use);
const missingReq = required.filter(id => !present.includes(id));
if (missingReq.length) console.warn('⚠ Fehlende Pflichtblöcke:', missingReq.join(', '));

// Nur Libs NICHT-lazy-Blöcke kommen in den <head>; lazy-Blöcke laden zur Laufzeit (fc-blocks.js).
const headLibs = new Set();
used.forEach(u => { const c = catById[u.use]; if (c && !c.lazy) (c.libs || []).forEach(l => headLibs.add(l)); });
const LIBTAGS = {
  echarts: '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>',
  chartjs: '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
  leaflet: '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>',
  katex: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>'
};

function partial(id) {
  const p = path.join(DIR, 'blocks', id + '.html');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  const c = catById[id] || {};
  return `<p class="text-sm text-slate-400">Block-Partial <code>blocks/${id}.html</code> noch nicht extrahiert (Platzhalter). Kategorie: ${c.category || '?'}.</p>`;
}

function shell(u) {
  const c = catById[u.use] || { id: u.use, title: u.use, category: '?', libs: [] };
  const state = u.collapsed === true ? 'collapsed' : (u.collapsed === false ? 'expanded' : (c.defaultState || 'expanded'));
  const badges = [`<span class="fc-badge b-cat">${c.category}</span>`]
    .concat(c.required ? ['<span class="fc-badge b-req">Pflicht</span>'] : [])
    .concat((c.libs || []).map(l => `<span class="fc-badge b-lib">${l}</span>`))
    .concat(c.lazy ? ['<span class="fc-badge b-lazy">lazy</span>'] : []);
  return `<section class="fc-block" data-block="${c.id}" data-state="${state}" data-required="${!!c.required}">
  <button class="fc-block-head" aria-expanded="${state === 'expanded'}"><span class="fc-block-title">${c.title}</span>${badges.join(' ')}<span class="fc-chevron">▾</span></button>
  <div class="fc-block-body">${partial(c.id)}</div>
</section>`;
}

const css = fs.readFileSync(path.join(DIR, 'fc-blocks.css'), 'utf8');
const js = fs.readFileSync(path.join(DIR, 'fc-blocks.js'), 'utf8');
const personas = catalog.personas || ['buerger'];
const manifestForRuntime = { module: manifest.module, personaDefault: manifest.personaDefault, personaPresets: manifest.personaPresets || {} };

const html = `<!DOCTYPE html>
<!-- GENERIERT vom FinCoach Module Composition Framework · compose.mjs · ${manifest.dataStand || ''} · Quelle: ${path.basename(manifestArg)} -->
<html lang="de" class="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${manifest.module?.toUpperCase()} · ${manifest.title} · FinCoach AI</title>
<script>window.FCB_INIT={};</script>

<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
${[...headLibs].map(l => LIBTAGS[l] || '').join('\n')}
<script>tailwind.config={darkMode:'class',theme:{extend:{fontFamily:{sans:['Inter','system-ui','sans-serif'],display:['Space Grotesk','sans-serif'],mono:['JetBrains Mono','monospace']},colors:{tngb:{bg:'#0A0F1A',card:'#121A2E',cyan:'#00CFFF',emerald:'#00CC7A',magenta:'#E6399A',orange:'#FF6B00',lavender:'#9933FF',gold:'#DFAF0F',indigo:'#4472C4',coral:'#E040A0',muted:'#64748B',border:'#1E293B'}}}}};</script>
<style>body{background:#0A0F1A;color:#E2E8F0;font-family:'Inter',sans-serif}${css}</style>
</head><body>
<nav class="fixed top-0 left-0 right-0 z-50" style="background:rgba(10,15,26,.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,207,255,.15)"><div class="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
<a href="https://www.TheNextGenerationBanking.com" target="_blank" rel="noopener" class="flex items-center gap-3">
<svg viewBox="0 0 100 100" class="w-8 h-8"><path d="M 6,95 L 6,53 A 8,8 0 0 1 22,53 L 22,95 Z" fill="#E6399A" fill-opacity=".25" stroke="#E6399A" stroke-width="2"/><path d="M 26,95 L 26,35 A 8,8 0 0 1 42,35 L 42,95 Z" fill="#00CFFF" fill-opacity=".25" stroke="#00CFFF" stroke-width="2"/><path d="M 46,95 L 46,21 A 8,8 0 0 1 62,21 L 62,95 Z" fill="#00CC7A" fill-opacity=".25" stroke="#00CC7A" stroke-width="2"/><path d="M 66,95 L 66,10 A 8,8 0 0 1 82,10 L 82,95 Z" fill="#FF6B00" fill-opacity=".25" stroke="#FF6B00" stroke-width="2"/></svg>
<div><div class="font-display font-bold text-white leading-tight">FinCoach AI</div><div class="text-[10px] text-tngb-cyan font-mono">by TheNextGenerationBanking.com</div></div></a>
<span class="text-[10px] font-mono text-slate-500">generiert · MCF</span></div></nav>
<section class="pt-28 pb-6 px-6"><div class="max-w-5xl mx-auto">
<div class="text-xs font-mono text-tngb-cyan mb-1">${manifest.module?.toUpperCase()} · generiert aus Manifest</div>
<h1 class="font-display font-black text-3xl md:text-4xl text-white mb-4">${manifest.title}</h1>
<div class="bg-tngb-card border border-tngb-border rounded-xl p-4 flex flex-wrap items-end gap-4">
<div><label class="block text-[10px] font-mono text-slate-500 uppercase mb-1">Ansicht für</label><select id="fc-persona" class="fc-ctl">${personas.map(p => `<option value="${p}">${p}</option>`).join('')}</select></div>
<div><label class="block text-[10px] font-mono text-slate-500 uppercase mb-1">Wissensniveau</label><select id="fc-level" class="fc-ctl"><option value="einsteiger">Einsteiger</option><option value="fortgeschritten" selected>Fortgeschritten</option><option value="experte">Experte</option></select></div>
<button id="fc-expand-all" class="fc-btn">▾ Alle auf</button>
<button id="fc-collapse-all" class="fc-btn">▸ Alle zu</button>
<span class="text-[11px] font-mono text-slate-500 ml-auto">Datenstand ${manifest.dataStand || ''}</span>
</div></div></section>
<main id="fc-module" class="max-w-5xl mx-auto px-6 pb-16">
${used.map(shell).join('\n')}
</main>
<footer class="max-w-5xl mx-auto px-6 py-8 border-t border-tngb-border text-xs text-slate-500">© 2026 <a href="https://www.TheNextGenerationBanking.com" target="_blank" rel="noopener" class="text-tngb-cyan hover:underline font-mono">TheNextGenerationBanking.com</a> · FinCoach AI · ${manifest.module?.toUpperCase()} · generiert via Module Composition Framework</footer>
<script>window.FCB_MANIFEST=${JSON.stringify(manifestForRuntime)};</script>
<script>${js}</script>
</body></html>`;

const outDir = path.join(DIR, 'out');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, (manifest.slug || ('modul-' + manifest.module)) + '.composed.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log('✔ Modul generiert:', path.relative(process.cwd(), outFile));
console.log('  Blöcke:', used.length, '· Head-Libs:', [...headLibs].join(',') || 'keine', '· lazy-Libs zur Laufzeit');
