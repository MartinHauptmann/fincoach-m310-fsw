/* FinCoach Module Composition Framework · Runtime (static mode)
   Wirkt auf bereits im DOM stehende .fc-block-Sektionen (vom Generator erzeugt):
   - Ein-/Ausklappen mit Persistenz
   - Lazy-Init: window.FCB_INIT[blockId](bodyEl) wird erst beim ersten Aufklappen aufgerufen
   - Persona × θ: ordnet/klappt nach window.FCB_MANIFEST.personaPresets
   - „Alle ein-/ausklappen", Deep-Link #block=<id>
*/
window.FCB_INIT = window.FCB_INIT || {};
(function () {
  var LIB = {
    echarts: [['js', 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js']],
    chartjs: [['js', 'https://cdn.jsdelivr.net/npm/chart.js']],
    leaflet: [['css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'], ['js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js']],
    katex: [['css', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'], ['js', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js']]
  };
  var cache = {};
  function inject(kind, url) {
    return new Promise(function (res, rej) {
      if (kind === 'css') { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; l.onload = res; l.onerror = res; document.head.appendChild(l); }
      else { var s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s); }
    });
  }
  var FCB = {
    loadLib: function (name) {
      if (cache[name]) return cache[name];
      var res = (LIB[name] || []);
      cache[name] = Promise.all(res.map(function (r) { return inject(r[0], r[1]); }));
      return cache[name];
    }
  };
  window.FCB = FCB;

  function key() { return 'fc_' + ((window.FCB_MANIFEST && FCB_MANIFEST.module) || 'mod') + '_blocks'; }
  function persist() { var o = {}; document.querySelectorAll('.fc-block').forEach(function (s) { o[s.dataset.block] = s.dataset.state; }); try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {} }
  function restore() { try { return JSON.parse(localStorage.getItem(key()) || '{}'); } catch (e) { return {}; } }

  function wire(sec) {
    var head = sec.querySelector('.fc-block-head'); var body = sec.querySelector('.fc-block-body'); var id = sec.dataset.block; var inited = false;
    function ensure() { if (inited) return; inited = true; var fn = window.FCB_INIT[id]; if (typeof fn === 'function') { try { fn(body); } catch (e) { console.error('FCB init', id, e); } } }
    function setState(st, save) { sec.dataset.state = st; if (head) head.setAttribute('aria-expanded', st === 'expanded'); if (st === 'expanded') ensure(); if (save !== false) persist(); }
    if (head) head.addEventListener('click', function () { setState(sec.dataset.state === 'expanded' ? 'collapsed' : 'expanded'); });
    sec._set = setState;
    if (sec.dataset.state !== 'collapsed') ensure();
  }

  function applyPersona(persona, level) {
    var root = document.getElementById('fc-module'); if (!root) return;
    var secs = Array.prototype.slice.call(root.querySelectorAll('.fc-block'));
    // θ-Heuristik
    secs.forEach(function (s) {
      var id = s.dataset.block;
      if (level === 'einsteiger' && ['science-foundation', 'wikipedia-check', 'decision-matrix', 'interdisciplinary-map'].indexOf(id) >= 0) s._set('collapsed');
      if (level === 'experte' && ['science-foundation', 'wikipedia-check'].indexOf(id) >= 0) s._set('expanded');
    });
    var pre = (window.FCB_MANIFEST && FCB_MANIFEST.personaPresets && FCB_MANIFEST.personaPresets[persona]) || {};
    (pre.collapse || []).forEach(function (id) { var s = root.querySelector('.fc-block[data-block="' + id + '"]'); if (s) s._set('collapsed'); });
    (pre.expand || []).forEach(function (id) { var s = root.querySelector('.fc-block[data-block="' + id + '"]'); if (s) s._set('expanded'); });
    (pre.hide || []).forEach(function (id) { var s = root.querySelector('.fc-block[data-block="' + id + '"]'); if (s && s.dataset.required !== 'true') s.style.display = 'none'; });
    // show non-hidden again
    secs.forEach(function (s) { if ((pre.hide || []).indexOf(s.dataset.block) < 0) s.style.display = ''; });
    if (pre.orderFirst) { pre.orderFirst.slice().reverse().forEach(function (id) { var s = root.querySelector('.fc-block[data-block="' + id + '"]'); if (s) root.insertBefore(s, root.firstChild); }); }
  }

  function init() {
    var saved = restore();
    document.querySelectorAll('.fc-block').forEach(function (s) { if (saved[s.dataset.block]) s.dataset.state = saved[s.dataset.block]; wire(s); });
    var ea = document.getElementById('fc-expand-all'); if (ea) ea.addEventListener('click', function () { document.querySelectorAll('.fc-block').forEach(function (s) { s._set('expanded'); }); });
    var ca = document.getElementById('fc-collapse-all'); if (ca) ca.addEventListener('click', function () { document.querySelectorAll('.fc-block').forEach(function (s) { s._set('collapsed'); }); });
    var sp = document.getElementById('fc-persona'), sl = document.getElementById('fc-level');
    function apply() { applyPersona(sp ? sp.value : null, sl ? sl.value : null); }
    if (sp) sp.addEventListener('change', apply);
    if (sl) sl.addEventListener('change', apply);
    var t = parseFloat(localStorage.getItem('cat_theta')); if (!isNaN(t) && sl) sl.value = t < -1 ? 'einsteiger' : (t > 1 ? 'experte' : 'fortgeschritten');
    if (window.FCB_MANIFEST && (FCB_MANIFEST.personaDefault) && sp) sp.value = FCB_MANIFEST.personaDefault;
    apply();
    if (location.hash.indexOf('#block=') === 0) { var id = location.hash.slice(7); var s = document.querySelector('.fc-block[data-block="' + id + '"]'); if (s) { s._set('expanded'); s.scrollIntoView({ behavior: 'smooth' }); } }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
