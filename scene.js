// Geometry is built once in the unit disk. Only the observer's isometry changes.
(() => {
  const canvas = document.querySelector('.space canvas');
  if (!canvas || !window.diskIsometries) return;
  const ctx = canvas.getContext('2d', {alpha: true});
  if (!ctx) return;

  // (z+c)/(1+conj(c)z) sends the origin to c.
  function translate(x, y, cx, cy) {
    const r = 1 + cx*x + cy*y, i = cx*y - cy*x, d = r*r + i*i;
    return [((x+cx)*r + (y+cy)*i)/d, ((y+cy)*r - (x+cx)*i)/d];
  }
  function along(start, end, t) {
    const [x,y] = translate(...end, -start[0], -start[1]);
    // A diameter becomes the circular geodesic between the two endpoints.
    const length = Math.hypot(x,y);
    const step = length ? Math.tanh(t*Math.atanh(length))/length : 0;
    return translate(x*step, y*step, ...start);
  }
  const angle = Math.PI/4, ch = 1/(Math.tan(angle/2)*Math.tan(Math.PI/3));
  const rho = Math.sqrt((ch-1)/(ch+1)), origin = [0,0];
  const corners = Array.from({length: 8}, (_,j) => [rho*Math.cos(angle*j), rho*Math.sin(angle*j)]);
  const styles = ['facet','engraving','mirror','contour','edge'];
  const model = [];
  function addLine(style, a, b, pieces) {
    const points = Array.from({length: pieces+1}, (_,j) => along(a,b,j/pieces));
    model.push({style, points});
  }
  // Give all eight sides the same engraving, including under reflection.
  // The side is a true geodesic. The inscribed circle and its hatching are ink.
  const wall=(1+rho*rho)/(2*rho*Math.cos(angle/2));
  const inradius=wall-Math.sqrt(wall*wall-1);
  for (let j=0; j<8; j++) {
    const v=corners[j], w=corners[(j+1)%8];
    const circlePoint=t => [inradius*Math.cos((j+t)*angle),inradius*Math.sin((j+t)*angle)];
    const rim=Array.from({length:17},(_,i)=>circlePoint(i/16));
    const band=Array.from({length:17},(_,i)=>along(v,w,i/16)).concat([...rim].reverse());
    model.push({style:'facet',points:band},{style:'contour',points:rim});
    for (let i=1;i<=8;i++) {
      const t=i/9;
      addLine('engraving',along(v,w,t),circlePoint(t),4);
    }
    addLine('mirror',along(origin,v,.45),v,8);
    addLine('edge',v,w,16);
  }
  const tiles = [], seen = new Set();
  function edgeKey(a,b) {
    const key = p => Math.round(p[0]*1e5)+','+Math.round(p[1]*1e5);
    return [key(a),key(b)].sort().join('/');
  }
  for (const transforms of [window.diskIsometries,window.diskOuterIsometries]) {
    for (let k=0; k<transforms.length; k+=4) {
      const [cx,cy,cos,sin]=transforms.subarray(k,k+4);
      tiles.push({cx,cy,cos,sin,paths:null});
    }
  }
  function buildPaths({cx,cy,cos,sin}) {
    const map = ([x,y]) => translate(cos*x-sin*y,sin*x+cos*y,cx,cy);
    const paths = {};
    for (const style of styles) paths[style] = [];
    for (const {style,points} of model) {
      if (style === 'edge') {
        const key = edgeKey(map(points[0]), map(points[points.length-1]));
        if (seen.has(key)) continue;
        seen.add(key);
      }
      paths[style].push(new Float32Array(points.map(map).flat()));
    }
    return paths;
  }

  const scene = canvas.parentNode, route = document.body.dataset.scene;
  const speed = {home:1, papers:.22, notes:.15, about:.065, study:.09}[route] || .15;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 640px), (pointer: coarse)');
  const pause = document.getElementById('scene-pause'), reset = document.getElementById('scene-reset');
  const initial = {x:.20, y:-.23, heading:.48};
  let eye={...initial}, phase=0, offsetX=0, offsetY=0, paused=false;
  const stateKey='phase-roaming-v4';
  function restore() {
    try {
      const saved=JSON.parse(sessionStorage.getItem(stateKey) || 'null');
      if (!saved) {
        paused=JSON.parse(sessionStorage.getItem('phase-observer-v2') || '{}').paused===true;
        return;
      }
      if (![saved.phase,saved.eye?.x,saved.eye?.y,saved.eye?.heading,saved.x,saved.y].every(Number.isFinite)
          || Math.hypot(saved.eye.x,saved.eye.y)>.65) return;
      eye={...saved.eye}; phase=saved.phase; offsetX=saved.x; offsetY=saved.y; paused=saved.paused===true;
    } catch {}
  }
  restore();
  const save = () => {
    try { sessionStorage.setItem(stateKey,JSON.stringify({eye,phase,x:offsetX,y:offsetY,paused})); } catch {}
  };

  // Centres of the eight adjacent octagons. Each transvection along a side
  // normal is a symmetry (a side reflection composed with a diameter reflection).
  const neighbourRadius=2*rho*Math.cos(angle/2)/(1+rho*rho);
  const neighbours=corners.map((_,j) => {
    const bearing=angle*(j+.5);
    return [neighbourRadius*Math.cos(bearing),neighbourRadius*Math.sin(bearing)];
  });
  function walk(dt) {
    phase+=dt;
    // Fixed hyperbolic speed; only the steering rate changes slowly.
    const stride=Math.tanh(.087*dt/2);
    const bend=dt*(.0045*Math.sin(.049*phase+.8)+.003*Math.sin(.077*phase-.2));
    const bearing=eye.heading+bend/2;
    const dx=stride*Math.cos(bearing), dy=stride*Math.sin(bearing);
    const {x,y}=eye;
    [eye.x,eye.y]=translate(dx,dy,x,y);
    eye.heading+=bend-2*Math.atan2(x*dy-y*dx,1+x*dx+y*dy);

    // Across a face, express the very same point and tangent in the adjoining
    // tile's chart. This bounds coordinates and reuses a finite patch forever.
    const norm=eye.x*eye.x+eye.y*eye.y;
    for (const [nx,ny] of neighbours) {
      if (2*(nx*eye.x+ny*eye.y)<=neighbourRadius*neighbourRadius*(1+norm)+1e-9) continue;
      eye.heading-=2*Math.atan2(ny*eye.x-nx*eye.y,1-nx*eye.x-ny*eye.y);
      [eye.x,eye.y]=translate(eye.x,eye.y,-nx,-ny);
      break;
    }
    eye.heading=Math.atan2(Math.sin(eye.heading),Math.cos(eye.heading));
  }
  // One CSS palette drives both the HTML and the five layers of ink.
  let ink;
  function readPalette() {
    const palette = getComputedStyle(scene);
    const pigment = palette.getPropertyValue('--geometry-rgb').trim();
    if (!pigment) return null;
    return styles.map(style => 'rgba('+pigment+','+palette.getPropertyValue('--'+style).trim()+')');
  }
  let width=0, height=0, radius=1, ox=0, oy=0, density=1, frame=0, last=0, interval=1000/30;
  let velocityX=0, velocityY=0, drag=null;
  const clamp = (v,n) => Math.max(-n, Math.min(n,v));
  function paint() {
    if (!ink) return;
    // The drag offset lives in the observer's tangent frame, so crossing
    // a chart boundary cannot change the drag direction or the screen image.
    const bearing=eye.heading+1.45, cs=Math.cos(bearing), sn=Math.sin(bearing);
    const dx=cs*offsetX-sn*offsetY, dy=sn*offsetX+cs*offsetY;
    const [ax,ay]=translate(dx,dy,eye.x,eye.y);
    const turn=-bearing+2*Math.atan2(eye.x*dy-eye.y*dx,1+eye.x*dx+eye.y*dy);
    const co=Math.cos(turn), si=Math.sin(turn);
    ctx.setTransform(density,0,0,density,0,0);
    ctx.clearRect(0,0,width,height);
    const visible = [];
    for (const tile of tiles) {
      const [x,y]=translate(tile.cx,tile.cy,-ax,-ay);
      const d=Math.hypot(x,y);
      // Maximum Euclidean distance from the image of the centre to any vertex.
      const bound=radius*rho*(1-d*d)/(1-rho*d)+3;
      const sx=ox+radius*(co*x-si*y), sy=oy+radius*(si*x+co*y);
      if (sx+bound>0 && sx-bound<width && sy+bound>0 && sy-bound<height) {
        if (!tile.paths) tile.paths=buildPaths(tile);
        visible.push({tile,bound});
      }
    }
    const compact=width<650;
    const weights=compact ? [0,.55,.56,.68,1.02] : [0,.62,.62,.78,1.26];
    for (let idx=0;idx<styles.length;idx++) {
      const style=styles[idx];
      ctx.beginPath();
      for (const {tile,bound} of visible) {
        // Suppress fine subdivisions where the projected chambers are small.
        if ((style==='engraving' || style==='facet') && bound < (compact ? 78 : 98)) continue;
        if ((style==='mirror' || style==='contour') && bound<28) continue;
        for (const path of tile.paths[style]) {
          for (let j=0;j<path.length;j+=2) {
            const x=path[j], y=path[j+1];
            const r=1-ax*x-ay*y, i=ay*x-ax*y, den=r*r+i*i;
            const px=((x-ax)*r+(y-ay)*i)/den, py=((y-ay)*r-(x-ax)*i)/den;
            const sx=ox+radius*(co*px-si*py), sy=oy+radius*(si*px+co*py);
            if (!j) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
          }
          if (!idx) ctx.closePath();
        }
      }
      if (!idx) {ctx.fillStyle=ink[0]; ctx.fill();}
      else {ctx.lineWidth=weights[idx]; ctx.strokeStyle=ink[idx]; ctx.stroke();}
    }
    scene.classList.add('rendered');
  }
  function canRoam() {return !paused && !reduced.matches && !small.matches;}
  let watch=0, lastPulse=0;
  function advance(now) {
    if (!last) last=now;
    const elapsed=now-last;
    if (elapsed>=interval-1) {
      const dt=Math.min(elapsed/1000,.1);
      last=now;
      if (!drag) {
        walk(dt*speed);
        offsetX=clamp(offsetX+velocityX*dt,.18); offsetY=clamp(offsetY+velocityY*dt,.18);
        velocityX*=Math.exp(-5*dt); velocityY*=Math.exp(-5*dt);
      }
      const start=performance.now(); paint();
      if (performance.now()-start>32) interval=Math.min(65,interval+2);
    }
  }
  function tick(now) {
    frame=0;
    if (document.hidden || !canRoam()) return;
    lastPulse=performance.now(); advance(now);
    frame=requestAnimationFrame(tick);
  }
  // Some embedded WebViews report a visible document but suppress display
  // callbacks. Keep their foreground view alive without waking hidden pages.
  function checkDisplay() {
    if (document.hidden || !canRoam()) return;
    const now=performance.now(), starved=now-lastPulse>220;
    if (starved) advance(now);
    const delay=starved ? Math.max(0,Math.ceil(interval-(performance.now()-now))) : 250;
    watch=setTimeout(checkDisplay,delay);
  }
  function schedule() {
    cancelAnimationFrame(frame); clearTimeout(watch); frame=0; last=0;
    if (!document.hidden && canRoam()) {
      lastPulse=performance.now(); frame=requestAnimationFrame(tick);
      watch=setTimeout(checkDisplay,250);
    }
    if (pause) {
      pause.hidden=reduced.matches || small.matches;
      pause.textContent=paused?'Resume motion':'Pause motion';
    }
    if (reset) reset.hidden=small.matches;
  }
  function resize() {
    width=canvas.clientWidth; height=canvas.clientHeight;
    ink=readPalette();
    if (!width || !height || !ink) return;
    density=Math.min(window.devicePixelRatio||1,1.6);
    canvas.width=Math.round(width*density); canvas.height=Math.round(height*density);
    // Look into a near-tangent portion of the disk. The ideal boundary
    // stays above the viewport; projected cell size increases towards its foot.
    ox=.49*width; oy=height*(width<650 ? 2.6 : 5.35);
    radius=1.009*Math.hypot(Math.max(ox,width-ox),Math.max(oy,height-oy));
    paint(); schedule();
  }
  function resetView() {
    eye={...initial}; phase=offsetX=offsetY=velocityX=velocityY=0; paint(); save(); schedule();
  }
  if (pause) pause.addEventListener('click',() => {paused=!paused; save(); schedule();});
  if (reset) reset.addEventListener('click',resetView);
  const surface=document.querySelector('.drag-surface');
  if (surface) {
    surface.addEventListener('pointerdown',e => {
      if (small.matches || e.button!==0) return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp};
      velocityX=velocityY=0; surface.setPointerCapture(e.pointerId);
    });
    surface.addEventListener('pointermove',e => {
      if (!drag || drag.id!==e.pointerId) return;
      const dx=(drag.x-e.clientX)*.55/radius, dy=(drag.y-e.clientY)*.55/radius;
      const dt=Math.max(.016,(e.timeStamp-drag.time)/1000);
      offsetX=clamp(offsetX+dx,.18); offsetY=clamp(offsetY+dy,.18);
      velocityX=clamp(dx/dt,.22); velocityY=clamp(dy/dt,.22);
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp}; paint();
    });
    surface.addEventListener('lostpointercapture',e => {
      if (!drag || drag.id!==e.pointerId) return;
      // Holding the view still before release also lets its momentum settle.
      const fade=Math.exp(-8*Math.max(0,e.timeStamp-drag.time)/1000);
      velocityX*=fade; velocityY*=fade;
      drag=null; save();
    });
  }
  for (const query of [reduced,small]) query.addEventListener('change',schedule);
  window.addEventListener('resize',resize);
  window.addEventListener('load',resize,{once:true});
  window.addEventListener('pagehide',save);
  window.addEventListener('pageshow',e => {
    if (e.persisted) {restore(); velocityX=velocityY=0; paint();}
    schedule();
  });
  document.addEventListener('visibilitychange',() => {if (document.hidden) save(); schedule();});
  resize();
})();
