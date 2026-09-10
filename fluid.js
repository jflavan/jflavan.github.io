/* =============================================================================
   Ink — a compact WebGL Navier–Stokes fluid ("ink in water") for johnflavan.com

   Based on the well-known stable-fluids recipe (Jos Stam; Pavel Dobryakov's
   WebGL implementation, MIT). Velocity is simulated on a small grid, dye on a
   larger one; the display pass composites dye over the page ground colour.

   API (global `Ink`):
     const ink = Ink.create(canvas, { bg:[r,g,b], ink:[r,g,b], touch:bool });
     ink.splat(x, y, dx, dy, strength)   // x,y in 0..1 (y up), dx,dy in texcoord units
     ink.setInk([r,g,b]); ink.setBg([r,g,b]); ink.storm(on); ink.pause(); ink.resume();
     ink.pointer(x, y, dx, dy)           // pixels; x,y relative to canvas, y down
     ink.destroy()
   Returns null when WebGL is unavailable.
   ============================================================================= */
(function (root) {
  'use strict';

  var BASE_VS = [
    'precision highp float;',
    'attribute vec2 aPosition;',
    'varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;',
    'uniform vec2 texelSize;',
    'void main () {',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);',
    '  vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'].join('\n');

  var COPY_FS = 'precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; void main(){ gl_FragColor = texture2D(uTexture, vUv); }';

  var SPLAT_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;',
    'void main () {',
    '  vec2 p = vUv - point.xy; p.x *= aspectRatio;',
    '  vec3 splat = exp(-dot(p, p) / radius) * color;',
    '  vec3 base = texture2D(uTarget, vUv).xyz;',
    '  gl_FragColor = vec4(base + splat, 1.0);',
    '}'].join('\n');

  var ADVECTION_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;',
    'vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {',
    '  vec2 st = uv / tsize - 0.5; vec2 iuv = floor(st); vec2 fuv = fract(st);',
    '  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize); vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);',
    '  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize); vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);',
    '  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);',
    '}',
    'void main () {',
    '#ifdef MANUAL_FILTERING',
    '  vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;',
    '  vec4 result = bilerp(uSource, coord, dyeTexelSize);',
    '#else',
    '  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;',
    '  vec4 result = texture2D(uSource, coord);',
    '#endif',
    '  float decay = 1.0 + dissipation * dt;',
    '  gl_FragColor = result / decay;',
    '}'].join('\n');

  var DIVERGENCE_FS = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;',
    '  float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;',
    '  vec2 C = texture2D(uVelocity, vUv).xy;',
    '  if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; }',
    '  if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; }',
    '  float div = 0.5 * (R - L + T - B);',
    '  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);',
    '}'].join('\n');

  var CURL_FS = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;',
    '  float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;',
    '  float vorticity = R - L - T + B;',
    '  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);',
    '}'].join('\n');

  var VORTICITY_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB; uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;',
    'void main () {',
    '  float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;',
    '  float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x;',
    '  float C = texture2D(uCurl, vUv).x;',
    '  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));',
    '  force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;',
    '  vec2 velocity = texture2D(uVelocity, vUv).xy; velocity += force * dt;',
    '  velocity = min(max(velocity, -1000.0), 1000.0);',
    '  gl_FragColor = vec4(velocity, 0.0, 1.0);',
    '}'].join('\n');

  var PRESSURE_FS = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uPressure; uniform sampler2D uDivergence;',
    'void main () {',
    '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;',
    '  float divergence = texture2D(uDivergence, vUv).x;',
    '  float pressure = (L + R + B + T - divergence) * 0.25;',
    '  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);',
    '}'].join('\n');

  var GRADIENT_FS = [
    'precision mediump float; precision mediump sampler2D;',
    'varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uPressure; uniform sampler2D uVelocity;',
    'void main () {',
    '  float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;',
    '  float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;',
    '  vec2 velocity = texture2D(uVelocity, vUv).xy; velocity.xy -= vec2(R - L, T - B);',
    '  gl_FragColor = vec4(velocity, 0.0, 1.0);',
    '}'].join('\n');

  var DISPLAY_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uTexture; uniform vec3 uBg; uniform float uFade;',
    'float hash (vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main () {',
    '  vec3 c = texture2D(uTexture, vUv).rgb * uFade;',
    '  c = c / (1.0 + c);',                       // soft roll-off so bright dye never clips
    '  float grain = (hash(vUv * 1024.0) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(uBg + c + grain, 1.0);',
    '}'].join('\n');

  function getWebGLContext(canvas) {
    var params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    var gl = canvas.getContext('webgl2', params);
    var isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    if (!gl) return null;
    var halfFloat, supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }
    gl.clearColor(0, 0, 0, 1);
    var halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES);
    if (!halfFloatTexType) return null;
    var formatRGBA, formatRG, formatR;
    if (isWebGL2) {
      formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = formatRGBA; formatR = formatRGBA;
    }
    if (!formatRGBA) return null;
    return { gl: gl, ext: { formatRGBA: formatRGBA, formatRG: formatRG, formatR: formatR, halfFloatTexType: halfFloatTexType, supportLinearFiltering: !!supportLinearFiltering } };
  }

  function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
        case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
        default: return null;
      }
    }
    return { internalFormat: internalFormat, format: format };
  }

  function supportRenderTextureFormat(gl, internalFormat, format, type) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.deleteFramebuffer(fbo); gl.deleteTexture(texture);
    return ok;
  }

  function compileShader(gl, type, source, keywords) {
    if (keywords && keywords.length) source = keywords.map(function (k) { return '#define ' + k + '\n'; }).join('') + source;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  function createProgram(gl, vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    var uniforms = {}, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var name = gl.getActiveUniform(program, i).name; uniforms[name] = gl.getUniformLocation(program, name); }
    return { program: program, uniforms: uniforms, bind: function () { gl.useProgram(program); } };
  }

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = getWebGLContext(canvas);
    if (!ctx) return null;
    var gl = ctx.gl, ext = ctx.ext;

    var config = {
      SIM_RES: opts.touch ? 96 : 128,
      DYE_RES: opts.touch ? 512 : (opts.dye || 1024),
      DENSITY_DISSIPATION: opts.densityDissipation != null ? opts.densityDissipation : 0.55,
      VELOCITY_DISSIPATION: opts.velocityDissipation != null ? opts.velocityDissipation : 0.18,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: opts.touch ? 8 : 14,
      CURL: opts.curl != null ? opts.curl : 22,
      SPLAT_RADIUS: opts.radius != null ? opts.radius : 0.32,
      SPLAT_FORCE: 5000,
      TIME_SCALE: opts.timeScale != null ? opts.timeScale : 0.75   // slows the swirl without changing its character
    };

    var bg = opts.bg || [0.067, 0.067, 0.063];
    var inkColor = opts.ink || [0.95, 0.93, 0.88];
    var inkStrength = opts.strength != null ? opts.strength : 0.55;
    var fade = 1;

    var vs = compileShader(gl, gl.VERTEX_SHADER, BASE_VS);
    var P = {
      copy: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, COPY_FS)),
      splat: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, SPLAT_FS)),
      advection: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, ADVECTION_FS, ext.supportLinearFiltering ? [] : ['MANUAL_FILTERING'])),
      divergence: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, DIVERGENCE_FS)),
      curl: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, CURL_FS)),
      vorticity: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, VORTICITY_FS)),
      pressure: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, PRESSURE_FS)),
      gradient: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FS)),
      display: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, DISPLAY_FS))
    };

    // Fullscreen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target) {
      if (target == null) { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      else { gl.viewport(0, 0, target.width, target.height); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      var fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture: texture, fbo: fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w, h, i, f, t, p) {
      var fbo1 = createFBO(w, h, i, f, t, p), fbo2 = createFBO(w, h, i, f, t, p);
      return { width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; }, set read(v) { fbo1 = v; }, get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap: function () { var t2 = fbo1; fbo1 = fbo2; fbo2 = t2; } };
    }

    function getResolution(resolution) {
      var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      var min = Math.round(resolution), max = Math.round(resolution * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    var dye, velocity, divergence, curl, pressure;
    function deleteFBO(t) { if (!t) return; gl.deleteTexture(t.texture); gl.deleteFramebuffer(t.fbo); }
    function resizeFBO(target, w, h, i, fmt, t, p) {
      var next = createFBO(w, h, i, fmt, t, p);
      P.copy.bind();
      gl.uniform1i(P.copy.uniforms.uTexture, target.attach(0));
      blit(next);
      deleteFBO(target);
      return next;
    }
    function resizeDoubleFBO(target, w, h, i, fmt, t, p) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, i, fmt, t, p);
      deleteFBO(target.write);
      target.write = createFBO(w, h, i, fmt, t, p);
      target.width = w; target.height = h; target.texelSizeX = 1 / w; target.texelSizeY = 1 / h;
      return target;
    }
    function initFramebuffers() {
      var simRes = getResolution(config.SIM_RES), dyeRes = getResolution(config.DYE_RES);
      var texType = ext.halfFloatTexType, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
      var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      if (!dye) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      if (!velocity) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      else velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      deleteFBO(divergence); deleteFBO(curl);
      if (pressure) { deleteFBO(pressure.read); deleteFBO(pressure.write); }
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, opts.touch ? 1.5 : 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr)), h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    }

    resizeCanvas();
    initFramebuffers();

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); destroyed = true;
      if (typeof opts.onLost === 'function') opts.onLost();
    }, false);

    var splats = [];
    var pendingPointer = null;
    function splat(x, y, dx, dy, color, strength) {
      P.splat.bind();
      gl.uniform1i(P.splat.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(P.splat.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(P.splat.uniforms.point, x, y);
      gl.uniform3f(P.splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(P.splat.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
      blit(velocity.write); velocity.swap();
      gl.uniform1i(P.splat.uniforms.uTarget, dye.read.attach(0));
      var s = strength == null ? inkStrength : strength;
      gl.uniform3f(P.splat.uniforms.color, color[0] * s, color[1] * s, color[2] * s);
      blit(dye.write); dye.swap();
    }
    function correctRadius(radius) { var aspect = canvas.width / canvas.height; if (aspect > 1) radius *= aspect; return radius; }

    function step(dt) {
      gl.disable(gl.BLEND);
      P.curl.bind();
      gl.uniform2f(P.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.curl.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      P.vorticity.bind();
      gl.uniform2f(P.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.vorticity.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.vorticity.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(P.vorticity.uniforms.curl, config.CURL);
      gl.uniform1f(P.vorticity.uniforms.dt, dt);
      blit(velocity.write); velocity.swap();

      P.divergence.bind();
      gl.uniform2f(P.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.divergence.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      // Pressure: decay the previous solution rather than clearing
      P.copy.bind();
      gl.uniform1i(P.copy.uniforms.uTexture, pressure.read.attach(0));
      blit(pressure.write); pressure.swap();

      P.pressure.bind();
      gl.uniform2f(P.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.pressure.uniforms.uDivergence, divergence.attach(0));
      for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(P.pressure.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write); pressure.swap();
      }

      P.gradient.bind();
      gl.uniform2f(P.gradient.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(P.gradient.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(P.gradient.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write); velocity.swap();

      P.advection.bind();
      gl.uniform2f(P.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering) gl.uniform2f(P.advection.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      var velocityId = velocity.read.attach(0);
      gl.uniform1i(P.advection.uniforms.uVelocity, velocityId);
      gl.uniform1i(P.advection.uniforms.uSource, velocityId);
      gl.uniform1f(P.advection.uniforms.dt, dt);
      gl.uniform1f(P.advection.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write); velocity.swap();

      if (!ext.supportLinearFiltering) gl.uniform2f(P.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(P.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.advection.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(P.advection.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write); dye.swap();
    }

    function render() {
      P.display.bind();
      gl.uniform1i(P.display.uniforms.uTexture, dye.read.attach(0));
      gl.uniform3f(P.display.uniforms.uBg, bg[0], bg[1], bg[2]);
      gl.uniform1f(P.display.uniforms.uFade, fade);
      blit(null);
    }

    // ---- driving loop ----
    var running = true, destroyed = false, last = performance.now(), storming = false, idleTimer = 0, idleEvery = 1.6;
    var lastPointer = null;

    function autoSplat(dt) {
      idleTimer += dt;
      var every = storming ? 0.08 : idleEvery;
      if (idleTimer < every) return;
      idleTimer = 0;
      idleEvery = 1.2 + Math.random() * 2.2;
      var x = Math.random(), y = Math.random();
      var angle = Math.random() * Math.PI * 2;
      var force = storming ? 900 + Math.random() * 900 : 220 + Math.random() * 420;
      splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, inkColor, storming ? inkStrength * 1.6 : inkStrength * 0.7);
    }

    function frame(now) {
      if (destroyed) return;
      requestAnimationFrame(frame);
      if (!running) { last = now; return; }
      var dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      if (dt <= 0) return;
      if (resizeCanvas()) initFramebuffers();
      autoSplat(dt);
      dt *= config.TIME_SCALE;
      if (pendingPointer) { splats.push(pendingPointer); pendingPointer = null; }
      while (splats.length) { var s = splats.shift(); splat(s.x, s.y, s.dx, s.dy, s.color || inkColor, s.strength); }
      step(dt);
      render();
    }
    requestAnimationFrame(frame);

    // Seed a few slow swirls so the first frame is not empty
    for (var k = 0; k < 7; k++) { var a = Math.random() * Math.PI * 2; splat(0.15 + Math.random() * 0.7, 0.25 + Math.random() * 0.5, Math.cos(a) * 500, Math.sin(a) * 500, inkColor, inkStrength * 0.9); }

    return {
      splat: function (x, y, dx, dy, strength, color) { splats.push({ x: x, y: y, dx: dx, dy: dy, strength: strength, color: color }); },
      pointer: function (px, py, dx, dy) {
        // px,py relative to canvas in CSS px, y down; dx,dy movement in CSS px.
        // Movement is accumulated and released as one splat per frame, so a
        // high-rate mouse does not multiply the GPU work.
        var x = px / canvas.clientWidth, y = 1 - py / canvas.clientHeight;
        var aspect = canvas.clientWidth / canvas.clientHeight;
        var ddx = (dx / canvas.clientWidth) * config.SPLAT_FORCE * (aspect > 1 ? aspect : 1);
        var ddy = (-dy / canvas.clientHeight) * config.SPLAT_FORCE * (aspect < 1 ? 1 / aspect : 1);
        lastPointer = { x: x, y: y };
        if (pendingPointer) { pendingPointer.x = x; pendingPointer.y = y; pendingPointer.dx += ddx; pendingPointer.dy += ddy; pendingPointer.px += dx; pendingPointer.py += dy; }
        else pendingPointer = { x: x, y: y, dx: ddx, dy: ddy, px: dx, py: dy };
        var speed = Math.min(1, Math.hypot(pendingPointer.px, pendingPointer.py) / 40);
        if (speed < 0.02) { pendingPointer = null; return; }
        pendingPointer.strength = inkStrength * (0.25 + 0.75 * speed);
      },
      scroll: function (velocityPx) {
        var v = Math.max(-1, Math.min(1, velocityPx / 60));
        if (Math.abs(v) < 0.05) return;
        var x = lastPointer ? lastPointer.x : 0.5, y = lastPointer ? lastPointer.y : 0.5;
        splats.push({ x: x, y: y, dx: (Math.random() - 0.5) * 200 * v, dy: v * 900, strength: inkStrength * 0.6 * Math.abs(v) });
      },
      setInk: function (rgb) { inkColor = rgb; },
      setBg: function (rgb) { bg = rgb; },
      setFade: function (f) { fade = f; },
      storm: function (on) { storming = !!on; },
      pause: function () { running = false; },
      resume: function () { running = true; last = performance.now(); },
      isRunning: function () { return running; },
      destroy: function () { destroyed = true; }
    };
  }

  root.Ink = { create: create };
})(window);
