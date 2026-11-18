const profile = window.academicProfile;
const byId = (id) => document.getElementById(id);
if (profile.name) {
  for (const signature of document.querySelectorAll('[data-author]')) signature.textContent = profile.name;
}
const intro = byId('intro');
if (intro && profile.introduction) intro.textContent = profile.introduction;
const author = byId('profile-name');
if (author) {
  if (profile.name) author.textContent = profile.name;
  if (profile.bio) byId('profile-bio').textContent = profile.bio;
  if (profile.email) {
    const contact = byId('contact');
    contact.textContent = profile.email;
    contact.href = 'mailto:' + profile.email;
    contact.hidden = false;
  }
}
function element(tag, css, value) {
  const el = document.createElement(tag);
  if (css) el.className = css;
  if (value) el.textContent = value;
  return el;
}
function link(label, href, css, accessibleLabel) {
  const a = element('a', css, label);
  a.href = new URL(href, new URL('../', document.baseURI)).href;
  if (accessibleLabel) a.setAttribute('aria-label', accessibleLabel);
  return a;
}
function paperRow(paper) {
  const row = element('article', 'paper-row');
  const year = element('span', 'year', paper.year);
  const body = element('div', 'paper-body');
  const title = element('h3');
  title.append(paper.url ? link(paper.title, paper.url, '') : paper.title);
  body.append(title, element('p', '', [paper.authors, paper.venue].filter(Boolean).join('   /   ')));
  const links = element('div', 'paper-links');
  if (paper.topic) links.append(element('span', 'topic', paper.topic));
  if (paper.pdf) links.append(link('PDF ↗', paper.pdf, 'pdf-link', paper.title + ' PDF'));
  row.append(year, body, links);
  return row;
}
const list = byId('paper-list');
const filters = document.querySelectorAll('[data-group]');
function selectGroup(group) {
  filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.group === group)));
  byId('collection-title').textContent = group === 'mine' ? 'My publications' : 'Reading list';
  const papers = group === 'mine' ? profile.publications : profile.reading;
  list.replaceChildren(...papers.map(paperRow));
  if (!papers.length) list.append(element('p', 'empty', group === 'mine' ? 'The publication list will appear here.' : 'The reading list will appear here.'));
}
filters.forEach(b => b.addEventListener('click', () => selectGroup(b.dataset.group)));
if (list) selectGroup(profile.publications.length ? 'mine' : 'reading');
