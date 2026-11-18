// All three layers occupy the same physical square in lattice coordinates.
// The screen uses an oblique projection so that a block can be traced in depth.
(() => {
  const canvas = document.getElementById('lattice');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const data = window.spinLayers;
  const U = [332, -70], V = [155, 87], O = [62, 99], gap = 123;
  const ink = '#171c1f';
  const colors = [['#434a4f','#e4e7e9'],['#4c5358','#d4d9dc'],['#575f64','#cbd1d5']];
  const point = (level,u,v) => [O[0]+U[0]*u+V[0]*v, O[1]+gap*level+U[1]*u+V[1]*v];
  const textures = data.map((layer,level) => {
    const tile = 9, size = layer.length;
    const tex = document.createElement('canvas');
    tex.width = tex.height = size * tile;
    const pen = tex.getContext('2d');
    for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
      pen.fillStyle = colors[level][+layer[y][x]];
      pen.fillRect(x*tile,y*tile,tile,tile);
    }
    pen.strokeStyle = ['#363d4239','#343a3f52','#363d4250'][level];
    pen.lineWidth = [1,.72,.36][level];
    pen.beginPath();
    for (let i=0; i<=size; i++) {
      pen.moveTo(i*tile,0);pen.lineTo(i*tile,tex.height);
      pen.moveTo(0,i*tile);pen.lineTo(tex.width,i*tile);
    }
    pen.stroke();
    return tex;
  });
  let bx=4, by=4, frame=0;
  function shape(points,fill,stroke,width=1) {
    ctx.beginPath();ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function line(a,b,color,width=1) {
    ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function patch(level) {
    return [[bx,by],[bx+1,by],[bx+1,by+1],[bx,by+1]].map(([x,y])=>point(level,x/9,y/9));
  }
  function sheet(level) {
    const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>point(level,u,v));
    for (const [a,b] of [[corners[0],corners[3]],[corners[3],corners[2]]]) {
      shape([a,b,[b[0],b[1]+5],[a[0],a[1]+5]],'#82898e','#696f73',.65);
    }
    ctx.save();
    const len=textures[level].width;
    ctx.transform(U[0]/len,U[1]/len,V[0]/len,V[1]/len,...corners[0]);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(textures[level],0,0);
    ctx.restore();
    shape(corners,null,'#5b62678f',.9);
    const select=patch(level);
    shape(select,null,'#ffffff',4);
    shape(select,'#ffffff29',ink,1.8);
    for (const [x,y] of select) {ctx.fillStyle=ink;ctx.fillRect(x-1.5,y-1.5,3,3);}
    const [x,y]=corners[2];
    line([x+6,y],[581,y],'#8d959a',.8);
    ctx.fillStyle='#262d31';ctx.font='500 17px monospace';
    ctx.fillText(['a','3a','9a'][level],592,y-5);
    ctx.fillStyle='#565e65';ctx.font='12px monospace';
    ctx.fillText(data[level].length+' × '+data[level].length,592,y+14);
  }
  function draw() {
    frame=0;
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    const ratio=Math.min(window.devicePixelRatio||1,2.5);
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    ctx.setTransform(canvas.width/720,0,0,canvas.height/470,0,0);
    // Registration lines align corresponding corners of the three physical squares.
    ctx.setLineDash([2,5]);
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]) line(point(0,u,v),point(2,u,v),'#7c868b70');
    ctx.setLineDash([]);
    for(let level=2;level>=0;level--) {
      if(level<2) {
        const upper=patch(level),lower=patch(level+1);
        ctx.setLineDash([3,4]);
        for(const edge of [0,2]) line(upper[edge],lower[edge],'#222c31a6',1.25);
        ctx.setLineDash([]);
      }
      sheet(level);
    }
    let up=0;
    for(let y=3*by;y<3*by+3;y++) for(let x=3*bx;x<3*bx+3;x++) up+=Number(data[1][y][x]);
    document.getElementById('vote').textContent=up+'↑ '+(9-up)+'↓ → '+(up>=5?'+1':'−1');
    document.getElementById('poster').hidden=true;
  }
  function invalidate(){if(!frame) frame=requestAnimationFrame(draw);}
  function setBlock(x,y) {
    x=Math.max(0,Math.min(8,x));y=Math.max(0,Math.min(8,y));
    if(x!==bx||y!==by){bx=x;by=y;invalidate();}
  }
  function probe(event) {
    const r=canvas.getBoundingClientRect();
    const x=(event.clientX-r.left)*720/r.width-O[0];
    const y=(event.clientY-r.top)*470/r.height-O[1];
    const det=U[0]*V[1]-U[1]*V[0];
    for(let level=0;level<3;level++) {
      const dy=y-gap*level;
      const u=(x*V[1]-dy*V[0])/det, v=(dy*U[0]-x*U[1])/det;
      if(u>=0&&v>=0&&u<=1&&v<=1){setBlock(Math.floor(u*9),Math.floor(v*9));return;}
    }
  }
  canvas.addEventListener('pointermove',probe);
  canvas.addEventListener('pointerdown',probe);
  canvas.addEventListener('keydown',event=>{
    const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];
    if(delta){event.preventDefault();setBlock(bx+delta[0],by+delta[1]);}
  });
  new ResizeObserver(invalidate).observe(canvas);
  invalidate();
})();
