(() => {
  const key = 'bivvo.display-theme';
  let theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch {}
  function apply() {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = button.getAttribute('aria-label');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.4A8.5 8.5 0 0 1 9.6 4a8.5 8.5 0 1 0 10.4 10.4Z"/></svg><span>' + (theme === 'light' ? 'Escuro' : 'Claro') + '</span>';
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f7fb' : '#14131d');
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(key, theme); } catch {}
      apply();
    }));
  });
  window.addEventListener('storage', event => {
    if (event.key === key) { theme = event.newValue === 'dark' ? 'dark' : 'light'; apply(); }
  });
})();
