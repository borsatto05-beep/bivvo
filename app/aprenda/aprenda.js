/* Bivvo 8.15 — Central Aprenda: busca local nos guias da página. Sem dependências e sem enviar o termo buscado. */
(function () {
  'use strict';
  var form = document.querySelector('.ap-search');
  if (!form) return;
  var input = form.querySelector('input');
  var count = document.getElementById('ap-count');
  var empty = document.getElementById('ap-empty');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.ap-groups .ap-row'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.ap-groups [data-group]'));
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  var index = rows.map(function (r) { return norm(r.getAttribute('data-search')); });
  form.hidden = false; /* sem JS, a busca não aparece e a lista completa continua visível */
  function apply() {
    var terms = norm(input.value).split(/\s+/).filter(Boolean);
    var shown = 0;
    rows.forEach(function (r, i) {
      var ok = terms.every(function (t) { return index[i].indexOf(t) !== -1; });
      r.hidden = !ok; if (ok) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.ap-row:not([hidden])'); });
    empty.hidden = shown !== 0;
    count.textContent = terms.length ? (shown === 1 ? '1 guia' : shown + ' guias') : '';
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); apply();
    var first = document.querySelector('.ap-groups .ap-row:not([hidden]) a');
    var todos = document.getElementById('todos');
    if (todos) todos.scrollIntoView({ block: 'start' });
    if (first) first.focus({ preventScroll: true });
  });
  input.addEventListener('input', apply);
  var q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q.slice(0, 60); apply(); }
})();
