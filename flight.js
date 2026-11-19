// CSS supplies the first moving view. Both drawing backends follow its camera clock.
(() => {
  const field = document.querySelector('.flight');
  const clock = field.querySelector('.flight-route').getAnimations()[0];
  if (!clock || !field.dataset.motion) return;
  const cfg = JSON.parse(field.dataset.camera);
  const radians = Math.PI / 180;
  const pitch = cfg.pitchDeg * radians;
  const focus = 0.5 / Math.tan((cfg.fovDeg * radians) / 2);
  const ground = readGround(field.querySelector('.flight-sheet'));
  const theme = getComputedStyle(field);
  const ink = theme.getPropertyValue('--geometry-rgb').trim();
  const paper = theme.getPropertyValue('--page-bg').trim();
  const paperRGB = theme
    .getPropertyValue('--page-rgb')
    .split(',')
    .map((v) => Number(v) / 255);
  let periodMs = clock.effect.getComputedTiming().duration;
  let maxRatio = 1.5,
    previousFrame = 0,
    sampleTime = 0,
    samples = 0,
    late = 0;
  let canvas = field.querySelector('canvas');
  let width = 0,
    height = 0,
    ratio = 1;
  let frame = 0,
    suspended = false;
  let backend;

  // The generated SVG contains only absolute M, L and circular A commands.
  // Sample each arc once. At the nearest visible ground the chord error stays
  // below half a CSS pixel at a 1080px viewport height.
  function readGround(svg) {
    const data = [];
    for (const path of svg.querySelectorAll('path')) {
      const kind = Number(path.dataset.ink);
      const tokens = path.getAttribute('d').match(/[MLA]|[-+]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?/gi);
      let x,
        z,
        i = 0;
      const number = () => Number(tokens[i++]);
      while (i < tokens.length) {
        const command = tokens[i++];
        if (command === 'M') {
          x = number() / 1000;
          z = number() / 1000;
          continue;
        }
        if (command === 'L') {
          const bx = number() / 1000,
            bz = number() / 1000;
          data.push(x, z, bx, bz, kind);
          x = bx;
          z = bz;
          continue;
        }
        const radius = number() / 1000;
        i += 3; // second radius, axis rotation, large-arc flag
        const sign = number() ? 1 : -1;
        const bx = number() / 1000,
          bz = number() / 1000;
        const dx = bx - x,
          dz = bz - z,
          chord = Math.hypot(dx, dz);
        if (chord === 0) continue;
        const halfAngle = Math.asin(Math.min(1, chord / (2 * radius)));
        const sag = 2 * radius * Math.sin(halfAngle / 2) ** 2;
        const steps = Math.max(1, Math.ceil(Math.sqrt(sag / 0.000045)));
        const mx = (x + bx) / 2,
          mz = (z + bz) / 2;
        for (let j = 1; j <= steps; j++) {
          const a = halfAngle * ((2 * j) / steps - 1);
          const along = (radius * Math.sin(a)) / chord;
          const across = (sign * (2 * radius * Math.sin(a / 2) ** 2 - sag)) / chord;
          const nx = j === steps ? bx : mx + dx * along - dz * across;
          const nz = j === steps ? bz : mz + dz * along + dx * across;
          data.push(x, z, nx, nz, kind);
          x = nx;
          z = nz;
        }
      }
    }
    return new Float32Array(data);
  }

  function cameraPose() {
    const progress = ((clock.currentTime || 0) % periodMs) / periodMs;
    const angle = cfg.startDeg * radians + 2 * Math.PI * progress;
    const c = Math.cos(angle),
      s = Math.sin(angle);
    return [cfg.originX + cfg.radius * c, cfg.originZ + cfg.radius * s, c, s];
  }

  // A single static buffer of line segments. Only camera uniforms change.
  function gpuRenderer(gl) {
    const vertex = `#version 300 es
      precision highp float;
      in vec2 corner;
      in vec4 ends;
      in float kind;
      uniform vec4 eye;
      uniform vec4 lens; // focal pixels, eye height, sin(pitch), cos(pitch)
      uniform vec2 viewport;
      uniform float aa;
      out float crossStroke, halfStroke, opacity;
      vec3 projectGround(vec2 p) {
        vec2 d=p-eye.xy;
        float front=dot(d,vec2(-eye.w,eye.z));
        return vec3(-dot(d,eye.zw), front*lens.z-lens.y*lens.w, front*lens.w+lens.y*lens.z);
      }
      void main() {
        vec3 a=projectGround(ends.xy), b=projectGround(ends.zw);
        float clipDepth=lens.y/(lens.z+.5*viewport.y/lens.x*lens.w)*.996;
        if(max(a.z,b.z)<clipDepth) {gl_Position=vec4(2.,2.,0.,1.);return;}
        if(a.z<clipDepth) a=mix(a,b,(clipDepth-a.z)/(b.z-a.z));
        if(b.z<clipDepth) b=mix(b,a,(clipDepth-b.z)/(a.z-b.z));
        vec2 p=a.xy*(lens.x/a.z), q=b.xy*(lens.x/b.z);
        vec2 delta=q-p;
        vec2 tangent=delta*inversesqrt(max(dot(delta,delta),1e-8));
        bool end=corner.x>0.;
        float side=corner.y;
        float depth=end ? b.z : a.z;
        float radial=length(end ? ends.zw : ends.xy);
        float near=1./(1.+2.8*depth);
        // A foreshortened cell pitch in CSS pixels. Drop construction lines
        // as individual cells become unresolvable, keeping the main arcs crisp.
        float pitch=.31*max(0.,1.-radial*radial)*lens.x*lens.y/(depth*depth);
        // Depth softens the ink. At an oblique horizon the projected
        // cell spacing also determines which details remain discernible.
        float quiet=1.-(1.-smoothstep(.30,1.12,depth))*(.48+.52*smoothstep(2.,13.,pitch));
        float weight, tone, detail;
        if(kind>1.5) {
          weight=.86+1.26*near; tone=.44+.24*near; detail=smoothstep(.55,1.8,pitch);
        } else if(kind>.5) {
          weight=.55+.55*near; tone=.22+.12*near; detail=smoothstep(2.8,7.,pitch);
        } else {
          weight=.5+.42*near; tone=.13+.10*near; detail=smoothstep(4.,10.,pitch);
        }
        halfStroke=.5*weight*(1.-.18*quiet);
        opacity=tone*(1.-.34*quiet)*detail*(1.-smoothstep(.946,.994,radial));
        crossStroke=side*(halfStroke+aa);
        vec2 pixel=(end ? q : p)+vec2(-tangent.y,tangent.x)*crossStroke;
        // Slight overlap closes joins between adjacent samples of an arc.
        pixel+=tangent*(end ? .12 : -.12);
        gl_Position=vec4(2.*pixel/viewport,0.,1.);
      }`;
    const fragment = `#version 300 es
      precision highp float;
      uniform float aa;
      uniform vec3 ink, paper;
      in float crossStroke, halfStroke, opacity;
      out vec4 color;
      void main() {
        float coverage=clamp(.5+(halfStroke-abs(crossStroke))/(2.*aa),0.,1.);
        color=vec4(mix(paper,ink,opacity*coverage),1.);
      }`;
    const program = gl.createProgram();
    const shaders = [];
    let buffer, corners;
    function dispose() {
      if (buffer) gl.deleteBuffer(buffer);
      if (corners) gl.deleteBuffer(corners);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
    }
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ]) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Flight shader unavailable');
      gl.useProgram(program);
      corners = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, corners);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const corner = gl.getAttribLocation(program, 'corner');
      gl.enableVertexAttribArray(corner);
      gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, ground, gl.STATIC_DRAW);
      for (const [name, size, offset] of [
        ['ends', 4, 0],
        ['kind', 1, 16],
      ]) {
        const attr = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 20, offset);
        gl.vertexAttribDivisor(attr, 1);
      }
      gl.clearColor(...paperRGB, 1);
      gl.enable(gl.BLEND);
      // Use the strongest ink at joins. Overlapping subpixel arcs at the
      // horizon should not build up into dark dots as the camera moves.
      const lineRGB = ink.split(',').map((v) => Number(v) / 255);
      gl.blendEquation(paperRGB[0] > lineRGB[0] ? gl.MIN : gl.MAX);
      gl.uniform3fv(gl.getUniformLocation(program, 'ink'), lineRGB);
      gl.uniform3fv(gl.getUniformLocation(program, 'paper'), paperRGB);
    } catch (error) {
      dispose();
      throw error;
    }
    const loc = (name) => gl.getUniformLocation(program, name);
    const eye = loc('eye'),
      lens = loc('lens'),
      viewport = loc('viewport'),
      aa = loc('aa');
    return {
      name: 'webgl',
      dispose,
      resize() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(viewport, width, height);
        gl.uniform4f(lens, focus * height, cfg.height, Math.sin(pitch), Math.cos(pitch));
        gl.uniform1f(aa, 0.5 / ratio);
      },
      draw(pose) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4fv(eye, pose);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, ground.length / 5);
      },
    };
  }

  // The 2D path projects the same line buffer. Batch visible segments by ink
  // and distance to avoid a canvas stroke call for every geodesic.
  function vectorRenderer(ctx) {
    const sin = Math.sin(pitch),
      cos = Math.cos(pitch);
    const count = ground.length / 5;
    const cellSize = new Float32Array(count);
    const rimInk = new Float32Array(count);
    const detailStart = [4, 2.8, 0.55],
      detailRange = [6, 4.2, 1.25];
    for (let k = 0; k < count; k++) {
      const i = k * 5;
      const radius = Math.hypot((ground[i] + ground[i + 2]) / 2, (ground[i + 1] + ground[i + 3]) / 2);
      cellSize[k] = 0.31 * (1 - radius * radius);
      rimInk[k] = Math.max(0, Math.min(1, (0.994 - radius) / 0.048));
    }
    const buckets = 12;
    function smooth(lo, hi, value) {
      const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
      return t * t * (3 - 2 * t);
    }
    const brushes = [];
    for (let kind = 0; kind < 3; kind++)
      for (let band = 0; band < buckets; band++) {
        const strength = (band + 1) / buckets;
        brushes.push({
          width: [0.42 + 0.39 * strength, 0.45 + 0.59 * strength, 0.57 + 1.42 * strength ** 1.7][kind],
          color: 'rgba(' + ink + ',' + [0.22, 0.32, 0.66][kind] * strength + ')',
        });
      }
    return {
      name: 'canvas2d',
      dispose() {},
      resize() {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      },
      draw([ex, ez, c, s]) {
        const f = height * focus,
          clip = (cfg.height / (sin + (0.5 / focus) * cos)) * 0.996;
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, width, height);
        const paths = new Array(brushes.length);
        const y0 = height / 2 - (f * sin) / cos;
        for (let i = 0; i < ground.length; i += 5) {
          const x = ground[i] - ex,
            z = ground[i + 1] - ez,
            bx = ground[i + 2] - ex,
            bz = ground[i + 3] - ez;
          let da = (-s * x + c * z) * cos + cfg.height * sin,
            db = (-s * bx + c * bz) * cos + cfg.height * sin;
          if (da < clip && db < clip) continue;
          let xa = -c * x - s * z,
            xb = -c * bx - s * bz;
          if (da < clip) {
            xa += ((xb - xa) * (clip - da)) / (db - da);
            da = clip;
          }
          if (db < clip) {
            xb += ((xa - xb) * (clip - db)) / (da - db);
            db = clip;
          }
          const px = width / 2 + (xa * f) / da,
            qx = width / 2 + (xb * f) / db;
          if (Math.max(px, qx) < -2 || Math.min(px, qx) > width + 2) continue;
          const py = y0 + (f * cfg.height) / (cos * da),
            qy = y0 + (f * cfg.height) / (cos * db);
          const kind = ground[i + 4],
            depth = (da + db) / 2;
          const k = i / 5;
          const pixels = (cellSize[k] * f * cfg.height) / (depth * depth);
          const detail = Math.min(1, Math.max(0, (pixels - detailStart[kind]) / detailRange[kind]));
          const quiet = 1 - (1 - smooth(0.3, 1.12, depth)) * (0.48 + 0.52 * smooth(2, 13, pixels));
          const strength =
            detail *
            rimInk[k] *
            (kind === 2 ? 0.67 + 0.33 / (1 + 2.8 * depth) : 0.8) *
            (1 - 0.34 * quiet);
          const band = Math.round(strength * buckets) - 1;
          if (band < 0) continue;
          const idx = kind * buckets + band,
            path = paths[idx] || (paths[idx] = new Path2D());
          path.moveTo(px, py);
          path.lineTo(qx, qy);
        }
        paths.forEach((path, i) => {
          ctx.lineWidth = brushes[i].width;
          ctx.strokeStyle = brushes[i].color;
          ctx.stroke(path);
        });
      },
    };
  }

  const events = new AbortController();
  const listen = (target, event, fn) => target.addEventListener(event, fn, { signal: events.signal });
  function selectBackend() {
    let gl;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'low-power',
      });
      if (gl) return gpuRenderer(gl);
    } catch {
      /* A 2D canvas can still run at native screen coordinates. */
    }
    if (gl) {
      const replacement = canvas.cloneNode(false);
      canvas.replaceWith(replacement);
      canvas = replacement;
    }
    const ctx = canvas.getContext('2d', { alpha: false });
    return ctx && vectorRenderer(ctx);
  }
  function paint() {
    if (!backend || suspended || document.hidden || field.hasAttribute('data-suspended')) return;
    backend.draw(cameraPose());
    if (!field.classList.contains('rendered')) field.classList.add('rendered');
  }
  // Lower the backing resolution only after sustained misses. Keep strokes at
  // CSS-pixel widths and avoid repeatedly reallocating on isolated long frames.
  function watchPacing(now) {
    if (previousFrame && now > previousFrame) {
      const delta = now - previousFrame;
      samples++;
      sampleTime += delta;
      if (delta > 24) late++;
      if (sampleTime >= 1500 && samples >= 12) {
        if (late > samples * 0.3 && ratio > 1.02) {
          maxRatio = Math.max(1, ratio - 0.25);
          resize(false);
        }
        sampleTime = samples = late = 0;
      }
    }
    previousFrame = now;
  }
  function run(now) {
    frame = 0;
    if (now) watchPacing(now);
    paint();
    if (
      backend &&
      !suspended &&
      !document.hidden &&
      field.dataset.motion === 'playing' &&
      !field.hasAttribute('data-suspended')
    )
      frame = requestAnimationFrame(run);
  }
  function sync() {
    cancelAnimationFrame(frame);
    previousFrame = sampleTime = samples = late = 0;
    periodMs = Number(clock.effect.getComputedTiming().duration);
    run();
  }
  function resize(redraw = true) {
    const bounds = field.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !backend) return;
    width = bounds.width;
    height = bounds.height;
    ratio = Math.min(devicePixelRatio || 1, maxRatio, Math.sqrt(3200000 / (width * height)));
    const w = Math.max(1, Math.round(width * ratio)),
      h = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    backend.resize();
    if (redraw) paint();
  }
  try {
    backend = selectBackend();
  } catch {
    return;
  }
  if (!backend) return;
  field.dataset.renderer = backend.name;
  listen(canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    suspended = true;
    cancelAnimationFrame(frame);
    field.classList.remove('rendered');
  });
  listen(canvas, 'webglcontextrestored', () => {
    try {
      backend = selectBackend();
    } catch {
      backend = null;
    }
    if (!backend) return;
    field.dataset.renderer = backend.name;
    suspended = false;
    resize();
    sync();
  });
  const observer = new ResizeObserver(() => resize());
  observer.observe(field);
  listen(field, 'flightcontrol', sync);
  listen(window, 'pagehide', (event) => {
    cancelAnimationFrame(frame);
    if (event.persisted) return;
    events.abort();
    observer.disconnect();
    if (backend) backend.dispose();
  });
  resize();
  sync();
})();
