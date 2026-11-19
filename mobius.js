// A continuous unit normal along the centre line reverses after one turn.
(() => {
function mount() {
  const surface = document.querySelector('.band-plate');
  if (!surface || surface.dataset.mounted) return;
  surface.dataset.mounted = "true";
  const arrow = document.getElementById('normal-arrow');
  const foot = document.getElementById('normal-foot');
  const ruling = document.getElementById('band-ruling');
  const slider = document.getElementById('band-phase');
  const output = document.getElementById('lap-value');
  const button = document.getElementById('band-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 0, playing = !reduced.matches, visible = false, frame = 0, last = 0;
  function project(x,y,z) { return [240 + 145*x, 120 + 145*(.47*y - .8826664*z)]; }
  function render() {
    const u = 2*Math.PI*phase;
    const c = Math.cos(u+.65), s = Math.sin(u+.65);
    const halfCos = Math.cos(u/2), halfSin = Math.sin(u/2);
    const base = project(1.04*c,1.04*s,0);
    const tip = project((1.04-.41*halfSin)*c,(1.04-.41*halfSin)*s,.41*halfCos);
    const edge = v => project((1.04+v*halfCos)*c,(1.04+v*halfCos)*s,v*halfSin);
    arrow.setAttribute('d','M'+base.join(' ')+'L'+tip.join(' '));
    foot.setAttribute('cx',base[0]); foot.setAttribute('cy',base[1]);
    ruling.setAttribute('d','M'+edge(-.32).join(' ')+'L'+edge(.32).join(' '));
    slider.value = phase.toFixed(3);
    output.textContent = phase.toFixed(2);
  }
  function tick(now) {
    frame = 0;
    if (last) phase = (phase + Math.min((now-last)/1000,.05)/11) % 2;
    last = now; render(); schedule();
  }
  function schedule() {
    if (visible && playing && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame); frame = 0; last = 0;
    }
  }
  function playback(value) {
    playing = value;
    button.toggleAttribute('data-paused',!value);
    button.title = value ? 'Pause transport' : 'Play transport';
    button.setAttribute('aria-label',button.title);
    schedule();
  }
  slider.addEventListener('input',() => {
    playback(false); phase = Number(slider.value); render();
  });
  button.addEventListener('click',() => playback(!playing));
  const onPreference = () => playback(!reduced.matches);
  reduced.addEventListener('change', onPreference);
  const observer = new IntersectionObserver(entries => { visible=entries[0].isIntersecting; schedule(); });
  observer.observe(surface);
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('site:leave', () => {
    visible = false;
    observer.disconnect();
    cancelAnimationFrame(frame);
    reduced.removeEventListener('change', onPreference);
    document.removeEventListener('visibilitychange', schedule);
  }, {once:true});
  render(); playback(playing);
  document.getElementById('normal-frame').removeAttribute('hidden');
  document.querySelector('.band-playback').hidden = false;
  document.querySelector('.band-scrub').hidden = false;
}
document.addEventListener('site:page', mount);
mount();
})();
