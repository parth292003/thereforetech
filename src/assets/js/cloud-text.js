// Moving textures rendered inside large headings. The text stays semantic HTML; a canvas paints the texture
// through the letter shapes and the real text turns transparent only once the canvas is ready.
//   data-cloud-text         drifting clouds on a blue sky (the stance outcome line)
//   data-cloud-text="fluid" slow marbled liquid in four colours set per heading in CSS (--fluid-*): violet and pink
//                           for the frontier line
//   data-cloud-text="sky"   a dawn sky with drifting pale cloud ("How we work"); birds inside the letters are off
// Letters are drawn from `.cloud-text__line` (one block per line) or `.cloud-text__word` (inline words, so the
// heading can wrap naturally). Reduced motion, Save-Data or unavailable WebGL keep the solid-ink text.
(() => {
  const titles = [...document.querySelectorAll('[data-cloud-text]')];
  if (!titles.length || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;

  const vertex = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const common = `precision highp float;varying vec2 uv;uniform float time;uniform vec2 res;uniform vec3 c0,c1,c2,c3;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<6;i++){v+=a*noise(p);p=m*p*2.03+vec2(3.1,7.2);a*=.5;}return v;}`;
  // clouds: c0 sky, c1 cloud white, c2 cloud shadow, c3 lightest tone allowed inside the letters
  const clouds = common + `void main(){vec2 p=uv*vec2(res.x/res.y,1.)*2.6;vec2 flow=vec2(time*.22,time*.05);float warp=fbm(p*.63+flow*.31);float n=fbm(p+flow+vec2(warp*.9,-warp*.6));float wisps=fbm(p*2.4+flow*.75);float density=smoothstep(.4,.6,n*.88+wisps*.12);float light=fbm(p+flow+vec2(-.1,.12));vec3 tissue=mix(c2,c1,smoothstep(.35,.67,light));vec3 c=mix(c0,tissue,density*.96);vec3 W=vec3(.2126,.7152,.0722);float v=clamp((dot(c,W)-dot(c0,W))/max(1e-4,dot(c1,W)-dot(c0,W)),0.,1.);gl_FragColor=vec4(mix(c0,c3,v),1.);}`;
  // fluid: double domain warp gives slow marbled currents; c0 deep purple, c1 violet, c2 pink, c3 pale pink streaks
  const fluid = common + `void main(){vec2 p=uv*vec2(res.x/res.y,1.)*1.7;float t=time*.16;
 vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-vec2(t*.8,0.)));
 vec2 r=vec2(fbm(p+2.6*q+vec2(1.7,9.2)+t*.9),fbm(p+2.6*q+vec2(8.3,2.8)-t*.7));
 float f=fbm(p+2.8*r);float band=.5+.5*sin(f*10.+r.x*5.-t*2.);
 vec3 c=mix(c0,c1,smoothstep(.25,.65,f));c=mix(c,c2,smoothstep(.5,.95,band)*smoothstep(.3,.7,length(r)));
 c=mix(c,c3,smoothstep(.93,1.,band)*smoothstep(.45,.75,f)*.85);gl_FragColor=vec4(c,1.);}`;
  // sky: a dawn gradient (c0 top, c1 middle, c2 bottom) with soft pale clouds (c3) drifting
  const sky = common + `void main(){vec2 p=uv*vec2(res.x/res.y,1.)*2.2;float t=time*.12;float y=1.-uv.y;
 vec3 c=mix(c0,c1,smoothstep(0.,.6,y));c=mix(c,c2,smoothstep(.45,1.,y));
 float n=fbm(p*vec2(.6,1.6)+vec2(t,0.));float wisp=smoothstep(.55,.8,n);c=mix(c,c3,wisp*.55);gl_FragColor=vec4(c,1.);}`;
  const MODES = {
    clouds: { frag: clouds, tokens: ['--cloud-sky', '--cloud-white', '--cloud-shadow', '--cloud-light'], speed: 1.0 },
    fluid: { frag: fluid, tokens: ['--fluid-deep', '--fluid-violet', '--fluid-pink', '--fluid-pale'], speed: 1.0 },
    sky: { frag: sky, tokens: ['--sky-top', '--sky-mid', '--sky-low', '--sky-cloud'], speed: 1.0, birds: 0 },   // Parth: sky and cloud only, no birds in the letters
  };
  // colours are read from the heading itself, so each heading can set its own palette in CSS
  const token = (el, name) => {
    const hex = getComputedStyle(el).getPropertyValue(name).trim().slice(1);
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  };

  titles.forEach((title) => {
    const canvas = title.querySelector('canvas');
    const ctx = canvas && canvas.getContext('2d');
    const scene = title.closest('.scene') || title.closest('section') || title;
    const mode = MODES[title.dataset.cloudText] || MODES.clouds;
    let started = false;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) { started = true; io.disconnect(); setup().catch(() => { delete title.dataset.cloudReady; }); }
    }, { rootMargin: '300px' });
    io.observe(scene);

    async function setup() {
      const field = document.createElement('canvas'), mask = document.createElement('canvas'), mc = mask.getContext('2d');
      const gl = field.getContext('webgl', { alpha: false, preserveDrawingBuffer: true });
      if (!ctx || !gl || !mc) return;
      const shader = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, mode.frag));
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return; gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const attr = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
      const U = Object.fromEntries(['time', 'res', 'c0', 'c1', 'c2', 'c3'].map((k) => [k, gl.getUniformLocation(prog, k)]));
      const cols = mode.tokens.map((n) => token(title, n));

      let dpr = 1, elapsed = 0, last = 0, painted = 0;
      // small ink birds that fly through the sky inside the letters (sky mode only); fixed seed, so every visit matches
      let seed = 7; const rr = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const birds = Array.from({ length: mode.birds || 0 }, () => ({ x: rr(), y: 0.12 + rr() * 0.7, v: 0.018 + rr() * 0.03, s: 0.5 + rr() * 0.6, ph: rr() * 6.28, bob: rr() * 6.28 }));
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim() || '#111';
      function drawBirds(w, h) {
        if (!birds.length) return;
        const fs = parseFloat(getComputedStyle(title).fontSize) * dpr, u = fs * 0.07;
        ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, u * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        for (const b of birds) {
          const x = (((b.x + elapsed * b.v) % 1.15) - 0.075) * w, y = (b.y + 0.02 * Math.sin(elapsed * 0.8 + b.bob)) * h;
          const sz = u * b.s * 1.6, f = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(elapsed * 7 + b.ph));
          ctx.moveTo(x - sz, y - sz * f); ctx.quadraticCurveTo(x - sz * 0.4, y - sz * 0.3, x, y); ctx.quadraticCurveTo(x + sz * 0.4, y - sz * 0.3, x + sz, y - sz * f);
        }
        ctx.stroke();
      }
      function resize() {
        const r = title.getBoundingClientRect(), css = getComputedStyle(title);
        dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
        mask.width = canvas.width; mask.height = canvas.height;
        field.width = Math.min(900, canvas.width); field.height = Math.max(1, Math.round((field.width * r.height) / r.width));
        gl.viewport(0, 0, field.width, field.height);
        const upper = css.textTransform === 'uppercase';
        mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, mask.width, mask.height); mc.scale(dpr, dpr);
        mc.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`; mc.letterSpacing = css.letterSpacing; mc.textBaseline = 'alphabetic'; mc.fillStyle = '#000';
        for (const el of title.querySelectorAll('.cloud-text__line, .cloud-text__word')) {
          const text = upper ? el.textContent.toUpperCase() : el.textContent;
          // an inline word may wrap across lines only if it is one word; draw each of its rects (normally one)
          for (const b of el.getClientRects()) {
            const m = mc.measureText(text);
            const base = b.top - r.top + (b.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
            mc.fillText(text, b.left - r.left, base);
            break;
          }
        }
      }
      await document.fonts.ready;
      new ResizeObserver(resize).observe(title); resize();
      function paint() {
        gl.uniform1f(U.time, elapsed * mode.speed); gl.uniform2f(U.res, field.width, field.height);
        ['c0', 'c1', 'c2', 'c3'].forEach((k, i) => gl.uniform3fv(U[k], cols[i]));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(field, 0, 0, canvas.width, canvas.height);
        drawBirds(canvas.width, canvas.height);
        // one solid shape: fill-only text (nonzero winding, so overlapping glyph contours merge), no stroke
        ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        title.dataset.cloudReady = 'true';
      }
      function frame(now) {
        const r = scene.getBoundingClientRect();
        if (!document.hidden && r.bottom > 0 && r.top < innerHeight) {
          if (last) elapsed += Math.min(0.1, (now - last) / 1000);
          if (now - painted > 33) { paint(); painted = now; }
        }
        last = now; requestAnimationFrame(frame);
      }
      // review hook: paint a given moment exactly
      title.cloudFrame = (t) => { elapsed = t; paint(); };
      requestAnimationFrame(frame);
    }
  });
})();
