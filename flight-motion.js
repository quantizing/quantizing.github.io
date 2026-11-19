// The CSS camera starts with the document. Both renderers use this one timeline.
(() => {
  const field = document.querySelector('.flight');
  const route = field.querySelector('.flight-route');
  const pause = document.getElementById('scene-pause');
  const reset = document.getElementById('scene-reset');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  const animation = route.getAnimations().find(item => item.animationName === 'flight-orbit');
  if (!animation) return;

  let paused = reduced.matches;
  let hidden = document.hidden;
  let duration = Number(animation.effect.getComputedTiming().duration);
  function change() {
    field.dataset.motion = paused ? 'paused' : 'playing';
    field.toggleAttribute('data-suspended', hidden);
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
    field.dispatchEvent(new Event('flightcontrol'));
  }
  pause.addEventListener('click', () => { paused = !paused; change(); });
  reset.addEventListener('click', () => { animation.currentTime = 0; change(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; change(); });
  narrow.addEventListener('change', () => {
    const next = Number(animation.effect.getComputedTiming().duration);
    animation.currentTime = (animation.currentTime || 0) * next / duration;
    duration = next;
    change();
  });
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; change(); });
  window.addEventListener('pagehide', () => { hidden = true; change(); });
  window.addEventListener('pageshow', () => { hidden = document.hidden; change(); });
  function setPageSpeed() {
    const speed = document.body.dataset.scene === 'home' ? 1 : .38;
    if (animation.updatePlaybackRate) animation.updatePlaybackRate(speed);
    else animation.playbackRate = speed;
  }
  document.addEventListener('site:page', setPageSpeed);
  setPageSpeed();
  pause.hidden = reset.hidden = false;
  change();
})();
