// The comparison is scoped to the URL so a normal visit always opens on paper.
(() => {
  const theme = new URLSearchParams(location.search).get('theme');
  if (theme !== 'dark' && theme !== 'light') return;
  document.documentElement.dataset.theme = theme;
  function applyThemeLinks() {
    const paper = getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim();
    document.querySelector('meta[name="theme-color"]').content = paper;
    for (const a of document.querySelectorAll('a[href]')) {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\/(?:[^/]+\.html)?$/.test(url.pathname)) continue;
      if (a.getAttribute('href').startsWith('#')) continue;
      url.searchParams.set('theme', theme);
      a.href = url.href;
    }
  }
  document.addEventListener('DOMContentLoaded', applyThemeLinks);
  document.addEventListener('site:page', applyThemeLinks);
})();
