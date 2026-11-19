// Keep the camera and its clock alive. Each destination also has a standalone HTML file.
(() => {
  const routes = window.siteRoutes;
  if (!routes) return;
  const root = new URL('./', document.currentScript.src);
  function routeKey(url) {
    if (url.protocol !== root.protocol || url.host !== root.host || !url.pathname.startsWith(root.pathname)) return;
    let key = url.pathname.slice(root.pathname.length);
    if (!key || key.endsWith('/')) key += 'index.html';
    return [key, key + '.html', key + '/index.html'].find(path => Object.hasOwn(routes, path));
  }
  let current = routeKey(new URL(location.href));
  if (!current) return;
  const header = document.querySelector('.rail');
  for (const link of header.querySelectorAll('a')) link.href = link.href;
  const navLinks = [...header.querySelectorAll('nav a')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bookmarks = {
    '#mobius':'notes/mobius.html', '#boundary-threads':'notes/disk.html',
    '#lattice':'notes/ising.html', '#scales':'notes/ising.html'
  };
  function destination(url) {
    const key = routeKey(url);
    const legacy = (key === 'index.html' || key === 'notes/index.html') && bookmarks[url.hash];
    return legacy ? new URL(legacy + url.search + url.hash, root) : url;
  }
  const scripts = new Map([...document.querySelectorAll('script[data-study-script]')].map(s => [s.src, Promise.resolve()]));
  async function loadStudy(paths) {
    for (const path of paths) {
      const src = new URL(path, root).href;
      if (!scripts.has(src)) {
        scripts.set(src, new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = () => { scripts.delete(src); script.remove(); reject(new Error(path)); };
          document.head.append(script);
        }));
      }
      await scripts.get(src);
    }
  }

  let serial = 0;
  let transition;
  let entry = history.state?.phaseEntry || 0;
  let nextEntry = entry;
  const positions = new Map();
  try {
    history.replaceState({...history.state, phaseEntry:entry}, '');
    history.scrollRestoration = 'manual';
  } catch { return; }

  function position(url, saved) {
    let target;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch {}
    if (saved) scrollTo(saved[0], saved[1]);
    else if (target) target.scrollIntoView();
    else scrollTo(0, 0);
  }
  function updateHeader(key) {
    const active = routes[key].scene === 'study' ? 'notes' : routes[key].scene;
    for (const link of navLinks) {
      if (routes[routeKey(new URL(link.href))]?.scene === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  async function navigate(requested, mode) {
    const url = destination(requested);
    const key = routeKey(url);
    if (!key) return;
    const ticket = ++serial;
    transition?.cancel();
    let main = document.getElementById('main');
    const changing = current !== key;
    const animate = changing && !reduced.matches && typeof main.animate === 'function';
    const oldEntry = entry;
    const targetEntry = mode === 'pop' ? history.state?.phaseEntry : undefined;
    if (animate) {
      transition = main.animate([{opacity:1}, {opacity:0}], {duration:85, easing:'ease-in', fill:'forwards'});
      try { await transition.finished; } catch {}
      if (serial !== ticket) return;
    }

    positions.set(oldEntry, [scrollX, scrollY]);
    try {
      if (mode === 'push' && url.href !== location.href) {
        entry = ++nextEntry;
        history.pushState({phaseEntry:entry}, '', url);
      } else if (mode === 'pop') {
        entry = targetEntry ?? ++nextEntry;
        nextEntry = Math.max(nextEntry, entry);
        if (targetEntry === undefined || requested.href !== url.href) history.replaceState({...history.state, phaseEntry:entry}, '', url);
      } else if (mode === 'replace') {
        history.replaceState({...history.state, phaseEntry:entry}, '', url);
      }
    } catch {
      location.assign(url.href);
      return;
    }

    if (changing) {
      document.dispatchEvent(new Event('site:leave'));
      const page = routes[key];
      const template = document.createElement('template');
      template.innerHTML = page.main;
      const incoming = template.content.firstElementChild;
      document.body.classList.add('routed');
      document.body.dataset.scene = page.scene;
      main.replaceWith(incoming);
      main = incoming;
      current = key;
      document.title = page.title;
      document.querySelector('meta[name="description"]').content = page.description;
      updateHeader(key);
      document.dispatchEvent(new Event('site:page'));
      loadStudy(page.scripts).catch(error => console.warn('Study script unavailable', error.message));
      main.focus({preventScroll:true});
    } else if (url.hash === '#main') {
      main.focus({preventScroll:true});
    }
    position(url, mode === 'pop' && positions.get(entry));
    if (animate) {
      transition = main.animate([{opacity:0, transform:'translateY(3px)'}, {opacity:1, transform:'none'}],
        {duration:180, easing:'ease-out'});
    }
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const url = new URL(anchor.href);
    if (!routeKey(url) || url.search !== location.search) return;
    event.preventDefault();
    navigate(url, 'push');
  });
  window.addEventListener('popstate', () => navigate(new URL(location.href), 'pop'));
  const first = new URL(location.href);
  if (destination(first).href !== first.href) navigate(first, 'replace');
})();
