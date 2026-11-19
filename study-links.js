// Follow bookmarks made before the three explorations moved into Notes.
function followStudyBookmark() {
  const hash = location.hash;
  if (!hash) return;
  const target = { '#mobius': 'mobius.html', '#boundary-threads': 'disk.html',
    '#lattice': 'ising.html', '#scales': 'ising.html' }[hash];
  if (target) location.replace((document.querySelector('.home') ? 'notes/' : '') + target + location.search + hash);
}
followStudyBookmark();
window.addEventListener('hashchange', followStudyBookmark);
