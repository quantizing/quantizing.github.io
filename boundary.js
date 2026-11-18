// Unit Poincaré disk in a time-symmetric slice of pure global AdS3.
// Each geodesic is a rational quadratic Bézier arc. Its two endpoint
// tangents point radially, so its middle control point is the disk center.
(() => {
  const canvas = document.getElementById('boundary-disk');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stage = canvas.parentElement;
  const slider = document.getElementById('interval-angle');
  const readout = document.getElementById('angle-readout');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = 2 * Math.PI;
  const SIDE = 720, CENTER = SIDE / 2, R = 307;
  const anchor = -2.48;
  const background = document.createElement('canvas');
  let angle = Number(slider.value);
  let flashStart = -Infinity;
  let frame = 0;

  function arc(a, b) {
    const ax = R * Math.cos(a), ay = R * Math.sin(a);
    const bx = R * Math.cos(b), by = R * Math.sin(b);
    const weight = Math.abs(Math.sin((b - a) / 2));
    return function point(t) {
      const u = 1 - t;
      const d = u * u + 2 * weight * u * t + t * t;
      return [CENTER + (u*u*ax + t*t*bx)/d, CENTER + (u*u*ay + t*t*by)/d];
    };
  }
  function thread(pen, curve, color, width, start = 0, end = 1, steps = 80) {
    pen.beginPath();
    pen.moveTo(...curve(start));
    for (let i = 1; i <= steps; i++) pen.lineTo(...curve(start + (end - start) * i / steps));
    pen.strokeStyle = color;
    pen.lineWidth = width;
    pen.stroke();
  }
  function circle(pen, x, y, radius, fill) {
    pen.beginPath(); pen.arc(x,y,radius,0,TAU); pen.fillStyle = fill; pen.fill();
  }
  function prepare(size) {
    background.width = background.height = size;
    const p = background.getContext('2d');
    p.scale(size / SIDE, size / SIDE);
    p.fillStyle = '#171a1c'; p.fillRect(0,0,SIDE,SIDE);
    const patina = p.createRadialGradient(288,253,8,CENTER,CENTER,R);
    patina.addColorStop(0,'#303437'); patina.addColorStop(.78,'#22272a'); patina.addColorStop(1,'#1b2023');
    circle(p,CENTER,CENTER,R,patina);

    // These families are compositional choices. Every individual thread
    // still meets the boundary at right angles.
    for (let i = 0; i < 139; i++) {
      const s = i / 139, a = TAU*s - 2.57;
      const b = a + 1.97 + 1.35*Math.sin(a + .65) + .56*Math.sin(2*a - .18);
      const alpha = .22 + .25*(.5 + .5*Math.cos(a + .4));
      thread(p,arc(a,b),'rgba(214,223,226,'+alpha+')',.84);
    }
    for (let i = 0; i < 115; i++) {
      const a = TAU*i/115 + .21;
      const b = a - 1.53 - 1.13*Math.cos(2*a - .75);
      thread(p,arc(a,b),'rgba(212,220,222,.29)',.70);
    }
    for (let i = 0; i < 45; i++) {
      const s = i/44;
      const a = -2.84 + 1.21*s, b = .06 + 1.78*s + .12*Math.sin(TAU*s);
      thread(p,arc(a,b),'rgba(232,237,238,.30)',.72);
    }

    p.beginPath();p.arc(CENTER,CENTER,R,0,TAU);
    p.strokeStyle = '#b5bfc2'; p.lineWidth = .85; p.stroke();
    // Engraved rim graduations register the angular position of the endpoint.
    for (let i=0; i<120; i++) {
      const t = i*TAU/120, c = Math.cos(t), s = Math.sin(t);
      const outer = R + (i%10===0 ? 12 : 5);
      p.beginPath();p.moveTo(CENTER+(R+2)*c,CENTER+(R+2)*s);
      p.lineTo(CENTER+outer*c,CENTER+outer*s);
      p.lineWidth = .8;p.strokeStyle = i%10===0 ? '#838d91' : '#4e575b';p.stroke();
    }
  }
  function draw(now) {
    frame = 0;
    const cssSize = stage.getBoundingClientRect().width;
    if (!cssSize) return;
    const size = Math.ceil(cssSize * Math.min(window.devicePixelRatio || 1, 2.5));
    if (background.width !== size || canvas.width !== size || canvas.height !== size) {
      prepare(size);
      canvas.width = canvas.height = size;
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(background,0,0);
    ctx.setTransform(size/SIDE,0,0,size/SIDE,0,0);
    const end = anchor + angle * Math.PI / 180;
    const selected = arc(anchor,end);
    thread(ctx,selected,'rgba(17,20,21,.85)',4.6);
    thread(ctx,selected,'#f6f8f7',2.4);
    ctx.beginPath();ctx.arc(CENTER,CENTER,R,anchor,end);
    ctx.strokeStyle = '#e6ebec';ctx.lineWidth = 2;ctx.stroke();
    for (const t of [0,1]) {
      const [x,y] = selected(t);
      circle(ctx,x,y,6,'#15191b');circle(ctx,x,y,t === 1 ? 4.4 : 3.7,'#f1f6f6');
    }

    // A short afterglow is triggered by a gesture and then comes to rest.
    const progress = (now-flashStart)/1150;
    if (!reduced.matches && !document.hidden && progress>=0 && progress<1) {
      const [x,y] = selected(progress);
      const opacity = Math.sin(Math.PI*progress);
      const glow = ctx.createRadialGradient(x,y,0,x,y,15);
      glow.addColorStop(0,'rgba(255,255,255,'+.72*opacity+')');
      glow.addColorStop(1,'rgba(255,255,255,0)');
      circle(ctx,x,y,15,glow);
      circle(ctx,x,y,2.2,'rgba(255,255,255,'+opacity+')');
      schedule();
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function select(value) {
    const next = Math.max(Number(slider.min), Math.min(Number(slider.max), Math.round(value)));
    if (next === angle) return;
    angle = next;
    slider.value = String(next);
    readout.textContent = next + '°';
    slider.setAttribute('aria-valuetext', next + ' degrees');
    flashStart = performance.now();
    schedule();
  }
  function move(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX-rect.left)/rect.width*SIDE - CENTER;
    const y = (e.clientY-rect.top)/rect.height*SIDE - CENTER;
    const r = Math.hypot(x,y);
    if (r < R*.66 || r > R*1.13) return;
    select(((Math.atan2(y,x)-anchor+TAU)%TAU)*180/Math.PI);
  }
  slider.addEventListener('input',()=>select(Number(slider.value)));
  canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerdown',move);
  reduced.addEventListener('change',()=>{flashStart=-Infinity;schedule();});
  document.addEventListener('visibilitychange',()=>{flashStart=-Infinity;schedule();});
  new ResizeObserver(schedule).observe(stage);
  canvas.hidden = false;
  document.getElementById('disk-controls').hidden = false;
  draw(performance.now());
  document.getElementById('disk-poster').hidden = true;
})();
