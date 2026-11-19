// Fold a point across the geodesic sides of the central octagon, then use
// its dihedral orbit and disk automorphisms to place its images in each tile.
(() => {
function mount() {
  const canvas = document.getElementById('disk-orbit');
  if (!canvas || canvas.dataset.mounted) return;
  canvas.dataset.mounted = "true";
  const ctx = canvas.getContext('2d');
  if (!ctx || !window.diskIsometries) return;
  const palette = getComputedStyle(canvas);
  const orbitRGB = palette.getPropertyValue('--orbit-rgb').trim();
  const centralInk = palette.getPropertyValue('--central-point').trim();
  const seedInk = palette.getPropertyValue('--seed-outline').trim();
  const transforms = window.diskIsometries;
  const order = 8, step = 2*Math.PI/order;
  const coshRadius = 1/(Math.tan(Math.PI/order)*Math.tan(Math.PI/3));
  const vertex = Math.sqrt((coshRadius-1)/(coshRadius+1));
  const wall = (1+vertex*vertex)/(2*vertex*Math.cos(step/2));
  const rotations = Array.from({length:order},(_,i) => [Math.cos(step*i),Math.sin(step*i)]);
  const mirrors = rotations.map((_,i) => [wall*Math.cos(step*(i+.5)),wall*Math.sin(step*(i+.5))]);
  const count = document.getElementById('orbit-count');
  const buttons = Array.from(document.querySelectorAll('[data-seed]'));
  const presets = {general:[.26,.062],mirror:[.27,0],centre:[0,0]};
  let seed = presets.general, frame = 0;
  function fold(x,y) {
    // Picking extremely close to the ideal rim is not numerically useful.
    if (x*x+y*y > .984**2) return null;
    for (let i=0;i<60;i++) {
      const r2 = x*x+y*y;
      const side = mirrors.find(([cx,cy]) => 2*(x*cx+y*cy) > 1+r2+1e-9);
      if (!side) break;
      const [cx,cy] = side;
      const dx = x-cx, dy = y-cy;
      const factor = (wall*wall-1)/(dx*dx+dy*dy);
      x = cx+factor*dx; y = cy+factor*dy;
    }
    const radius = Math.hypot(x,y);
    const phi = Math.atan2(y,x);
    const angle = Math.abs(phi - step*Math.round(phi/step));
    return [radius*Math.cos(angle), radius*Math.sin(angle)];
  }
  function orbit() {
    const points = [];
    for (const [c,s] of rotations) {
      for (const sign of [1,-1]) {
        const x = c*seed[0]-sign*s*seed[1], y = s*seed[0]+sign*c*seed[1];
        if (points.every(([a,b]) => Math.hypot(x-a,y-b)>1e-7)) points.push([x,y]);
      }
    }
    return points;
  }
  function render() {
    frame = 0;
    const size = Math.round(canvas.clientWidth*Math.min(devicePixelRatio||1,2));
    if (!size) return;
    if (canvas.width!==size || canvas.height!==size) canvas.width=canvas.height=size;
    ctx.setTransform(size/500,0,0,size/500,0,0);
    ctx.clearRect(0,0,500,500);
    const points = orbit();
    // A visible mirror diameter makes the fixed-point presets easy to compare.
    ctx.beginPath(); ctx.moveTo(250-233*vertex,250); ctx.lineTo(250+233*vertex,250);
    ctx.strokeStyle='rgba('+orbitRGB+',.6)'; ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
    for (let i=0;i<transforms.length;i+=4) {
      const cx=transforms[i], cy=transforms[i+1], ux=transforms[i+2], uy=transforms[i+3];
      const scale=1-cx*cx-cy*cy;
      const dotRadius=.44+1.95*scale;
      ctx.fillStyle=i===0?centralInk:'rgba('+orbitRGB+','+(.23+.64*Math.sqrt(scale))+')';
      ctx.beginPath();
      for (const [x,y] of points) {
        const wx=ux*x-uy*y, wy=uy*x+ux*y;
        const dx=1+cx*wx+cy*wy, dy=cx*wy-cy*wx, den=dx*dx+dy*dy;
        const px=250+233*((wx+cx)*dx+(wy+cy)*dy)/den;
        const py=250+233*((wy+cy)*dx-(wx+cx)*dy)/den;
        ctx.moveTo(px+dotRadius,py); ctx.arc(px,py,dotRadius,0,2*Math.PI);
      }
      ctx.fill();
    }
    const sx=250+233*seed[0],sy=250+233*seed[1];
    ctx.beginPath();ctx.arc(sx,sy,5,0,2*Math.PI);ctx.strokeStyle=seedInk;ctx.lineWidth=1;ctx.stroke();
    count.textContent=String(points.length);
    const kind=points.length===1?'centre':points.length===8?'mirror':'general';
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.seed===kind)));
  }
  function requestDraw() { if (!frame) frame=requestAnimationFrame(render); }
  function pick(event) {
    if (event.type==='pointermove' && event.pointerType!=='mouse' && !event.buttons) return;
    const rect=canvas.getBoundingClientRect();
    const point=fold(((event.clientX-rect.left)/rect.width*500-250)/233,((event.clientY-rect.top)/rect.height*500-250)/233);
    if (point) {seed=point;requestDraw();}
  }
  buttons.forEach(b => b.addEventListener('click',()=>{seed=presets[b.dataset.seed]; requestDraw();}));
  canvas.addEventListener('pointerdown',pick);
  canvas.addEventListener('pointermove',pick);
  canvas.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-.018,0],ArrowRight:[.018,0],ArrowUp:[0,-.018],ArrowDown:[0,.018]}[event.key];
    if (!delta) return;
    event.preventDefault(); seed=fold(seed[0]+delta[0],seed[1]+delta[1])||seed; requestDraw();
  });
  canvas.hidden=false;
  document.getElementById('orbit-controls').hidden=false;
  document.getElementById('disk-gesture').hidden=false;
  const observer = new ResizeObserver(requestDraw);
  observer.observe(canvas);
  document.addEventListener('site:leave', () => { observer.disconnect(); cancelAnimationFrame(frame); }, {once:true});
  requestDraw();
}
document.addEventListener('site:page', mount);
mount();
})();
