window.glass = (() => {
  const PHOTO = "assets/bg.jpg";
  const LOOKS = {
    normal: { blur: Math.hypot(2, 9), saturate: 1.4, brightness: 0.9 },
    reading: { blur: Math.hypot(9, 30), saturate: 1.15, brightness: 0.58 },
  };

  const surface = document.createElement("canvas");
  surface.width = 1024;
  surface.height = 256;
  const gl = surface.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const VERTEX = `
    attribute vec2 a;
    varying vec2 v;
    void main() {
      v = a * 0.5 + 0.5;
      gl_Position = vec4(a, 0.0, 1.0);
    }`;

  const HEAD = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec2 v;`;

  const PHOTO_FRAGMENT = `${HEAD}
    uniform sampler2D u_photo;
    uniform vec2 u_view;
    uniform vec2 u_image;
    void main() {
      vec2 box = u_view * 1.04;
      vec2 b = vec2(v.x, 1.0 - v.y) * u_view + u_view * 0.02;
      float scale = max(box.x / u_image.x, box.y / u_image.y);
      vec2 shown = u_image * scale;
      vec2 uv = (b - (box - shown) * vec2(0.5, 0.4)) / shown;
      vec3 c = texture2D(u_photo, uv).rgb;
      c = mix(c, vec3(34.0, 28.0, 24.0) / 255.0, mix(0.34, 0.52, b.y / box.y));
      gl_FragColor = vec4(c, 1.0);
    }`;

  const BLUR_FRAGMENT = `${HEAD}
    uniform sampler2D u_tex;
    uniform vec2 u_step;
    uniform float u_finish;
    uniform float u_saturate;
    uniform float u_brightness;
    void main() {
      vec3 sum = vec3(0.0);
      float total = 0.0;
      for (int i = -8; i <= 8; i++) {
        float x = float(i);
        float w = exp(-0.5 * x * x / 7.1111);
        sum += texture2D(u_tex, v + u_step * x).rgb * w;
        total += w;
      }
      vec3 c = sum / total;
      if (u_finish > 0.5) {
        c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, u_saturate) * u_brightness;
        c = mix(c, vec3(1.0), mix(0.2, 0.06, (v.x + 1.0 - v.y) * 0.5));
      }
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`;

  const COPY_FRAGMENT = `${HEAD}
    uniform sampler2D u_tex;
    void main() {
      vec3 c = texture2D(u_tex, v).rgb;
      float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);
    }`;

  const LENS_FRAGMENT = `${HEAD}
    uniform sampler2D u_scene;
    uniform vec2 u_view;
    uniform vec2 u_origin;
    uniform vec2 u_size;
    uniform float u_radius;
    uniform float u_dpr;
    uniform vec2 u_pointer;
    uniform float u_hover;
    uniform float u_fill;

    vec3 scene(vec2 at) {
      return texture2D(u_scene, vec2(at.x / u_view.x, 1.0 - at.y / u_view.y)).rgb;
    }

    void main() {
      vec2 p = vec2(gl_FragCoord.x, u_size.y * u_dpr - gl_FragCoord.y) / u_dpr;
      vec2 half_size = u_size * 0.5;
      vec2 c = p - half_size;
      vec2 q = abs(c) - (half_size - u_radius);
      float depth = u_radius - length(max(q, 0.0)) - min(max(q.x, q.y), 0.0);
      if (depth <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
      }

      vec2 n;
      if (q.x > 0.0 && q.y > 0.0) n = normalize(q) * sign(c);
      else if (q.x > q.y) n = vec2(sign(c.x), 0.0);
      else n = vec2(0.0, sign(c.y));

      float bezel = min(u_radius * 0.92, 22.0);
      vec2 shift = vec2(0.0);
      float edge = 0.0;
      if (depth < bezel) {
        float u = 1.0 - depth / bezel;
        float body = max(1.0 - u * u * u * u, 0.000001);
        float dome = bezel * 0.9;
        float slope = dome * u * u * u / (pow(body, 0.75) * bezel);
        float incidence = atan(slope);
        float refracted = asin(sin(incidence) / 1.5);
        shift = -n * (dome * 0.5 + dome * pow(body, 0.25)) * tan(incidence - refracted) * 1.5;
        edge = u;
      }

      vec2 at = u_origin + p;
      vec3 color = vec3(scene(at + shift * 0.86).r, scene(at + shift).g, scene(at + shift * 1.14).b);
      color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, 1.18) * 1.05;

      color = mix(color, vec3(1.0), u_fill + 0.05 * u_hover);
      color += vec3(0.08) * edge * edge * edge * (1.0 + 0.6 * u_hover);

      if (u_pointer.x > -1000.0) {
        vec2 d = p - u_pointer;
        color += vec3(0.24) * u_hover * exp(-dot(d, d) / 6000.0);
      }

      float facing = dot(n, normalize(vec2(-0.6, -0.8)));
      float glint = facing > 0.0 ? pow(facing, 1.5) : pow(-facing, 1.5) * 0.6;
      float rim = (1.0 - smoothstep(0.0, 1.7, depth)) * (0.16 + 0.84 * glint) * (0.85 + 0.15 * u_hover);
      color = mix(color, vec3(1.0), clamp(rim, 0.0, 1.0));

      float alpha = clamp(depth * u_dpr, 0.0, 1.0);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
    }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };

  const program = (fragment, names) => {
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const id = gl.createProgram();
    gl.attachShader(id, vs);
    gl.attachShader(id, fs);
    gl.bindAttribLocation(id, 0, "a");
    gl.linkProgram(id);
    if (!gl.getProgramParameter(id, gl.LINK_STATUS)) return null;
    const at = {};
    names.forEach((name) => (at[name] = gl.getUniformLocation(id, name)));
    return { id, at };
  };

  const photoPass = program(PHOTO_FRAGMENT, ["u_photo", "u_view", "u_image"]);
  const blurPass = program(BLUR_FRAGMENT, ["u_tex", "u_step", "u_finish", "u_saturate", "u_brightness"]);
  const lensPass = program(LENS_FRAGMENT, [
    "u_scene",
    "u_view",
    "u_origin",
    "u_size",
    "u_radius",
    "u_dpr",
    "u_pointer",
    "u_hover",
    "u_fill",
  ]);
  const copyPass = program(COPY_FRAGMENT, ["u_tex"]);
  if (!photoPass || !blurPass || !lensPass || !copyPass) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  const texture = () => {
    const id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return id;
  };

  const target = () => ({ texture: texture(), buffer: gl.createFramebuffer() });
  const photo = texture();
  const targets = [target(), target()];
  const sceneSize = { w: 0, h: 0 };
  const image = { w: 1, h: 1 };

  const items = new Map();
  const sheets = new Map();
  const dirty = new Set();
  const view = { w: 1, h: 1 };
  const look = { ...LOOKS.normal };
  let fade = null;
  let ready = false;
  let dead = false;
  let sceneStale = true;
  let queued = false;

  const dprNow = () => Math.min(window.devicePixelRatio || 1, 2);

  const drawScene = () => {
    view.w = document.documentElement.clientWidth;
    view.h = window.innerHeight;
    const scale = Math.max(4, Math.ceil(look.blur * 0.375));
    const w = Math.max(2, Math.ceil(view.w / scale));
    const h = Math.max(2, Math.ceil(view.h / scale));
    if (w !== sceneSize.w || h !== sceneSize.h) {
      sceneSize.w = w;
      sceneSize.h = h;
      targets.forEach((t) => {
        gl.bindTexture(gl.TEXTURE_2D, t.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
      });
    }
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[0].buffer);
    gl.useProgram(photoPass.id);
    gl.bindTexture(gl.TEXTURE_2D, photo);
    gl.uniform1i(photoPass.at.u_photo, 0);
    gl.uniform2f(photoPass.at.u_view, view.w, view.h);
    gl.uniform2f(photoPass.at.u_image, image.w, image.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const spacing = ((look.blur / scale) * 3) / 8;
    gl.useProgram(blurPass.id);
    gl.uniform1i(blurPass.at.u_tex, 0);
    gl.uniform1f(blurPass.at.u_saturate, look.saturate);
    gl.uniform1f(blurPass.at.u_brightness, look.brightness);

    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[1].buffer);
    gl.bindTexture(gl.TEXTURE_2D, targets[0].texture);
    gl.uniform2f(blurPass.at.u_step, spacing / w, 0);
    gl.uniform1f(blurPass.at.u_finish, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, targets[0].buffer);
    gl.bindTexture(gl.TEXTURE_2D, targets[1].texture);
    gl.uniform2f(blurPass.at.u_step, 0, spacing / h);
    gl.uniform1f(blurPass.at.u_finish, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    sceneStale = false;

    if (!sheets.size) return;
    const fw = Math.max(2, Math.round(view.w));
    const fh = Math.max(2, Math.round(view.h));
    if (surface.width < fw || surface.height < fh) {
      surface.width = Math.max(surface.width, fw);
      surface.height = Math.max(surface.height, fh);
    }
    gl.viewport(0, 0, fw, fh);
    gl.useProgram(copyPass.id);
    gl.bindTexture(gl.TEXTURE_2D, targets[0].texture);
    gl.uniform1i(copyPass.at.u_tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    for (const [host, sheet] of sheets) {
      if (sheet.canvas.width !== fw || sheet.canvas.height !== fh) {
        sheet.canvas.width = fw;
        sheet.canvas.height = fh;
      }
      sheet.ctx.drawImage(surface, 0, surface.height - fh, fw, fh, 0, 0, fw, fh);
      host.classList.add("has-frost");
    }
  };

  const measure = (el, item) => {
    item.w = el.offsetWidth;
    item.h = el.offsetHeight;
    const corner = getComputedStyle(el).borderTopLeftRadius;
    const radius = corner.endsWith("%") ? (parseFloat(corner) / 100) * item.w : parseFloat(corner) || 0;
    item.radius = Math.min(radius, item.w / 2, item.h / 2);
  };

  const drawItem = (el, item, dpr) => {
    if (!item.w || !item.h) return;
    const pw = Math.round(item.w * dpr);
    const ph = Math.round(item.h * dpr);
    if (item.canvas.width !== pw || item.canvas.height !== ph) {
      item.canvas.width = pw;
      item.canvas.height = ph;
    }
    if (surface.width < pw || surface.height < ph) {
      surface.width = Math.max(surface.width, pw);
      surface.height = Math.max(surface.height, ph);
    }
    const box = el.getBoundingClientRect();

    gl.viewport(0, 0, pw, ph);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, pw, ph);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(lensPass.id);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[0].texture);
    gl.uniform1i(lensPass.at.u_scene, 0);
    gl.uniform2f(lensPass.at.u_view, view.w, view.h);
    gl.uniform2f(lensPass.at.u_origin, box.left + box.width / 2 - item.w / 2, box.top + box.height / 2 - item.h / 2);
    gl.uniform2f(lensPass.at.u_size, pw / dpr, ph / dpr);
    gl.uniform1f(lensPass.at.u_radius, item.radius);
    gl.uniform1f(lensPass.at.u_dpr, dpr);
    gl.uniform2f(lensPass.at.u_pointer, item.px, item.py);
    gl.uniform1f(lensPass.at.u_hover, item.hover);
    gl.uniform1f(lensPass.at.u_fill, el.getAttribute("aria-pressed") === "true" || el.dataset.glass === "bright" ? 0.24 : 0.035);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    item.ctx.clearRect(0, 0, pw, ph);
    item.ctx.drawImage(surface, 0, surface.height - ph, pw, ph, 0, 0, pw, ph);
  };

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  const frame = (now) => {
    queued = false;
    if (dead || !ready) return;
    let again = false;

    if (fade) {
      const t = Math.min(1, (now - fade.start) / 600);
      const k = ease(t);
      for (const key of Object.keys(look)) look[key] = fade.from[key] + (fade.to[key] - fade.from[key]) * k;
      if (t >= 1) fade = null;
      else again = true;
      sceneStale = true;
    }
    if (sceneStale) {
      drawScene();
      for (const [el, item] of items) if (item.visible) dirty.add(el);
    }

    const dpr = dprNow();
    for (const el of [...dirty]) {
      const item = items.get(el);
      dirty.delete(el);
      if (!item || !item.visible || !el.isConnected) continue;
      const gap = item.aim - item.hover;
      if (Math.abs(gap) > 0.01) {
        item.hover += gap * 0.2;
        dirty.add(el);
        again = true;
      } else {
        item.hover = item.aim;
      }
      drawItem(el, item, dpr);
    }
    if (again) schedule();
  };

  const schedule = () => {
    if (queued || dead) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  const mark = (el) => {
    dirty.add(el);
    schedule();
  };

  const refresh = () => {
    for (const [el, item] of items) if (item.visible) dirty.add(el);
    schedule();
  };

  const seen = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        const item = items.get(entry.target);
        if (!item) return;
        item.visible = entry.isIntersecting;
        if (item.visible) mark(entry.target);
      }),
    { rootMargin: "120px" }
  );

  const sized = new ResizeObserver((entries) =>
    entries.forEach((entry) => {
      const item = items.get(entry.target);
      if (!item) return;
      measure(entry.target, item);
      mark(entry.target);
    })
  );

  const attach = (el) => {
    if (dead || items.has(el)) return;
    const canvas = document.createElement("canvas");
    canvas.className = "glass-layer";
    canvas.setAttribute("aria-hidden", "true");
    const item = { canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, radius: 0, hover: 0, aim: 0, px: -9999, py: -9999, visible: false };
    items.set(el, item);
    el.prepend(canvas);
    measure(el, item);

    const point = (e) => {
      const box = el.getBoundingClientRect();
      item.px = ((e.clientX - box.left) / (box.width || 1)) * item.w;
      item.py = ((e.clientY - box.top) / (box.height || 1)) * item.h;
      mark(el);
    };
    el.addEventListener("pointerenter", (e) => {
      item.aim = 1;
      point(e);
    });
    el.addEventListener("pointermove", point);
    el.addEventListener("pointerleave", () => {
      item.aim = 0;
      mark(el);
    });
    el.addEventListener("pointercancel", () => {
      item.aim = 0;
      mark(el);
    });

    if (ready) el.classList.add("has-glass");
    seen.observe(el);
    sized.observe(el);
  };

  const prune = () => {
    for (const [el] of items) {
      if (el.isConnected) continue;
      seen.unobserve(el);
      sized.unobserve(el);
      items.delete(el);
      dirty.delete(el);
    }
  };

  const frost = (host) => {
    if (dead || sheets.has(host)) return;
    const layer = document.createElement("div");
    layer.className = "frost";
    layer.setAttribute("aria-hidden", "true");
    const canvas = layer.appendChild(document.createElement("canvas"));
    host.prepend(layer);
    sheets.set(host, { layer, canvas, ctx: canvas.getContext("2d") });
    sceneStale = true;
    schedule();
  };

  const stop = () => {
    dead = true;
    for (const [host, sheet] of sheets) {
      host.classList.remove("has-frost");
      sheet.layer.remove();
    }
    sheets.clear();
    for (const [el, item] of items) {
      el.classList.remove("has-glass");
      item.canvas.remove();
    }
    items.clear();
    dirty.clear();
  };

  surface.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stop();
  });

  const picture = new Image();
  picture.onload = () => {
    if (dead) return;
    image.w = picture.naturalWidth;
    image.h = picture.naturalHeight;
    gl.bindTexture(gl.TEXTURE_2D, photo);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, picture);
    } catch {
      stop();
      return;
    }
    ready = true;
    sceneStale = true;
    for (const [el] of items) el.classList.add("has-glass");
    refresh();
  };
  picture.onerror = stop;
  picture.src = PHOTO;

  window.addEventListener("scroll", refresh, { passive: true });
  window.addEventListener("resize", () => {
    sceneStale = true;
    for (const [el, item] of items) measure(el, item);
    refresh();
  });

  new MutationObserver(() => {
    const to = document.body.classList.contains("reading") ? LOOKS.reading : LOOKS.normal;
    const aim = fade ? fade.to : look;
    if (to.blur === aim.blur && !fade) return;
    if (fade && fade.to === to) return;
    fade = { from: { ...look }, to, start: performance.now() };
    schedule();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  if (document.body.classList.contains("reading")) Object.assign(look, LOOKS.reading);

  return { attach, prune, refresh, frost, mark: (el) => items.has(el) && mark(el) };
})();
