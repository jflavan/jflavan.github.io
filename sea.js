/* =============================================================================
   Sea — the black-water hero for johnflavan.com

   A port of the flotnoir.studio background: a dark, top-down sea surface whose
   picture is warped by a Navier–Stokes fluid that the pointer stirs. Their
   version distorts a looping video of a night sea; this one draws the sea in a
   shader instead (no footage, no download, runs forever, follows the theme).

   Pipeline per frame
     1. sea      — procedural heightfield (value-noise FBM with analytic
                   derivatives) lit as glossy black liquid → 8-bit texture
     2. fluid    — stable-fluids recipe (Jos Stam; Pavel Dobryakov's WebGL
                   implementation, MIT; the OGL "post-fluid-distortion" tuning):
                   splat → curl → vorticity → divergence → pressure (6 Jacobi
                   steps) → gradient subtract → advect velocity → advect dye
     3. composite — uv -= dye.rg * 0.0002 (the flotnoir refraction), tinted
                   between the page ground and the theme colour, plus grain

   API (global `Sea`):
     const sea = Sea.create(canvas, { bg:[r,g,b], ink:[r,g,b], touch:bool, onLost:fn });
     sea.pointer(x, y, dx, dy)   // CSS px relative to canvas, y down
     sea.scroll(velocityPx)      // scroll velocity stirs the water
     sea.setInk([r,g,b]); sea.setBg([r,g,b]); sea.setFade(0..1)
     sea.storm(on); sea.pause(); sea.resume(); sea.isRunning(); sea.destroy()
   Returns null when WebGL (with half-float render targets) is unavailable.
   ============================================================================= */
(function (root) {
  'use strict';

  /* ---------- shaders ---------- */

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

  var CLEAR_FS = 'precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value; void main(){ gl_FragColor = value * texture2D(uTexture, vUv); }';

  var SPLAT_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;',
    'void main () {',
    '  vec2 p = vUv - point.xy; p.x *= aspectRatio;',
    '  vec3 splat = exp(-dot(p, p) / radius) * color;',
    '  vec3 base = texture2D(uTarget, vUv).xyz;',
    '  gl_FragColor = vec4(base + splat, 1.0);',
    '}'].join('\n');

  // Multiplicative dissipation, as in the OGL example (0.95 per 60Hz frame)
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
    '  gl_FragColor = vec4(dissipation * result.rgb, 1.0);',
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
    '  vec2 vel = texture2D(uVelocity, vUv).xy;',
    '  gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);',
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

  // The sea: a heightfield of layered gradient noise (with analytic derivatives,
  // after Inigo Quilez) lit as a glossy black liquid from a low light at the
  // top of the frame. Writes luminance only.
  var SEA_FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform float uAspect; uniform float uTime; uniform float uStorm; uniform float uScale; uniform float uHeight; uniform float uShine; uniform float uRidge; uniform float uGain; uniform float uLacunarity; uniform float uCell; uniform float uCellScale; uniform float uPersp;',
    // gradient in [-1,1] per lattice point (fract-based so it stays clean as coordinates grow)
    'vec3 hash3 (vec3 p) {',
    '  p = fract(p * vec3(0.1031, 0.1030, 0.0973));',
    '  p += dot(p, p.yxz + 33.33);',
    '  return -1.0 + 2.0 * fract((p.xxy + p.yxx) * p.zyx);',
    '}',
    // value + gradient of 3D gradient noise (Inigo Quilez), quintic interpolation
    'vec4 noised (vec3 x) {',
    '  vec3 i = floor(x); vec3 f = fract(x);',
    '  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
    '  vec3 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);',
    '  vec3 ga = hash3(i + vec3(0.0, 0.0, 0.0)); vec3 gb = hash3(i + vec3(1.0, 0.0, 0.0));',
    '  vec3 gc = hash3(i + vec3(0.0, 1.0, 0.0)); vec3 gd = hash3(i + vec3(1.0, 1.0, 0.0));',
    '  vec3 ge = hash3(i + vec3(0.0, 0.0, 1.0)); vec3 gf = hash3(i + vec3(1.0, 0.0, 1.0));',
    '  vec3 gg = hash3(i + vec3(0.0, 1.0, 1.0)); vec3 gh = hash3(i + vec3(1.0, 1.0, 1.0));',
    '  float va = dot(ga, f - vec3(0.0, 0.0, 0.0)); float vb = dot(gb, f - vec3(1.0, 0.0, 0.0));',
    '  float vc = dot(gc, f - vec3(0.0, 1.0, 0.0)); float vd = dot(gd, f - vec3(1.0, 1.0, 0.0));',
    '  float ve = dot(ge, f - vec3(0.0, 0.0, 1.0)); float vf = dot(gf, f - vec3(1.0, 0.0, 1.0));',
    '  float vg = dot(gg, f - vec3(0.0, 1.0, 1.0)); float vh = dot(gh, f - vec3(1.0, 1.0, 1.0));',
    '  float v = va + u.x * (vb - va) + u.y * (vc - va) + u.z * (ve - va) + u.x * u.y * (va - vb - vc + vd) + u.y * u.z * (va - vc - ve + vg) + u.z * u.x * (va - vb - ve + vf) + (-va + vb + vc - vd + ve - vf - vg + vh) * u.x * u.y * u.z;',
    '  vec3 dv = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.z * (ge - ga) + u.x * u.y * (ga - gb - gc + gd) + u.y * u.z * (ga - gc - ge + gg) + u.z * u.x * (ga - gb - ge + gf) + (-ga + gb + gc - gd + ge - gf - gg + gh) * u.x * u.y * u.z',
    '    + du * (vec3(vb, vc, ve) - va + u.yzx * vec3(va - vb - vc + vd, va - vc - ve + vg, va - vb - ve + vf) + u.zxy * vec3(va - vb - ve + vf, va - vb - vc + vd, va - vc - ve + vg) + u.yzx * u.zxy * (-va + vb + vc - vd + ve - vf - vg + vh));',
    '  return vec4(v, dv);',
    '}',
    // FBM returning (height, dh/dx, dh/dy). Each octave is rotated and scaled;
    // the chain rule carries the derivatives back through that transform.
    'vec3 fbm (vec2 q, float z) {',
    '  float a = 0.5; vec3 r = vec3(0.0);',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8) * uLacunarity;',
    '  mat2 m = mat2(1.0, 0.0, 0.0, 1.0);',
    '  vec2 p = q;',
    '  for (int i = 0; i < 5; i++) {',
    '    vec4 n = noised(vec3(p, z));',
    '    float sa = sqrt(n.x * n.x + 0.03);',                   // smooth |n|: crests without a kink
    '    float s = mix(n.x, 1.0 - sa, uRidge);',                 // 0 = rounded swell, 1 = crests
    '    vec2 ds = mix(n.yz, -(n.x / sa) * n.yz, uRidge);',
    '    r.x += a * s; r.yz += a * (ds * m);',
    '    a *= uGain; p = rot * p; m = rot * m; z = z * 1.35 + 7.0;',
    '  }',
    '  return r;',
    '}',
    // Smooth Voronoi (F1 with a soft minimum) and its gradient: rounded pits
    // whose feature points drift, so the bowls breathe instead of sliding.
    'vec2 hash2 (vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }',
    'vec3 cellular (vec2 p, float t) {',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  float k = 8.0; float sum = 0.0; vec2 dsum = vec2(0.0);',
    '  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {',
    '    vec2 g = vec2(float(x), float(y));',
    '    vec2 o = hash2(i + g);',
    '    o = 0.5 + 0.4 * sin(t + 6.2831 * o);',
    '    vec2 r = g + o - f;',
    '    float w = exp(-k * dot(r, r));',                       // squared distance: a bowl, not a cone
    '    sum += w; dsum -= w * 2.0 * r;',
    '  }',
    '  return vec3(-log(sum) / k, dsum / sum);',
    '}',
    // two sizes of bowl, so the chop is not a uniform honeycomb
    'vec3 bowls (vec2 p, float t) {',
    '  vec3 a = cellular(p, t);',
    '  vec3 b = cellular(p * 2.1 + vec2(3.7, 1.9), t * 1.3 + 2.0);',
    '  return vec3(a.x + 0.45 * b.x, a.yz + 0.45 * 2.1 * b.yz);',
    '}',
    'void main () {',
    '  float t = uTime * (1.0 + uStorm * 1.6);',
    '  float persp = mix(1.0, uPersp, vUv.y);',                 // the camera looks forward: far chop is smaller
    '  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * uScale * persp;',
    '  p += vec2(0.035, -0.06) * t;',                            // slow roll toward the bottom
    '  vec3 f = fbm(p, t * 0.11);',
    '  vec3 c = bowls(p * uCellScale, t * 0.35);',
    '  c = vec3(c.x * 2.0 - 0.6, c.yz * 2.0 * uCellScale);',      // pits low, rims high
    '  f += uCell * c;',
    '  float h = f.x;',
    '  vec2 g = f.yz * uScale * persp * uHeight * (1.0 + uStorm * 0.7);',
    '  vec3 n = normalize(vec3(-g, 1.0));',
    '  vec3 L = normalize(vec3(0.18, 0.72, 0.40));',           // low light from the top of the frame
    '  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));',
    '  float spec = pow(max(dot(n, H), 0.0), uShine);',
    '  float dif = max(dot(n, L), 0.0);',
    '  float body = dif * dif * 0.2;',                          // soft gradient across each lump
    '  float rim = spec * 1.4;',                                  // the crisp glint on the lit edge
    '  float occl = smoothstep(0.1, 0.9, h);',                    // troughs stay black
    '  float lum = (body + rim) * (0.25 + 0.75 * occl);',
    '  lum *= mix(0.7, 1.3, vUv.y);',                             // the far water catches more light
    '  lum = lum / (1.0 + lum * 0.2);',                           // soft shoulder
    '  gl_FragColor = vec4(vec3(lum), 1.0);',
    '}'].join('\n');

  // flotnoir's post pass: the dye field (which holds pointer velocity) bends the
  // sampling of the picture. Then: ground → tint by luminance, grain.
  var COMPOSITE_FS = [
    'precision highp float; precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D tSea; uniform sampler2D tFluid;',
    'uniform vec3 uBg; uniform vec3 uInk; uniform float uFade; uniform float uDim;',
    'float hash (vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main () {',
    '  vec3 fluid = texture2D(tFluid, vUv).rgb;',
    '  vec2 uv = vUv - fluid.rg * 0.0002;',
    '  float lum = texture2D(tSea, uv).r * uDim * uFade;',
    '  vec3 col = uBg + (uInk - uBg) * lum;',
    '  col += (hash(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'].join('\n');

  /* ---------- WebGL plumbing ---------- */

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
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Sea shader: ' + gl.getShaderInfoLog(shader));
    return shader;
  }

  function createProgram(gl, vs, fs) {
    var program = gl.createProgram();
    gl.attachShader(program, vs); gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Sea program: ' + gl.getProgramInfoLog(program));
    var uniforms = {}, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var name = gl.getActiveUniform(program, i).name; uniforms[name] = gl.getUniformLocation(program, name); }
    return { program: program, uniforms: uniforms, bind: function () { gl.useProgram(program); } };
  }

  /* ---------- instance ---------- */

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = getWebGLContext(canvas);
    if (!ctx) return null;
    var gl = ctx.gl, ext = ctx.ext;

    // Fluid tuning is the OGL post-fluid-distortion example's, which flotnoir ships verbatim.
    var config = {
      SIM_RES: 128,
      DYE_RES: 512,
      PRESSURE_ITERATIONS: 6,
      DENSITY_DISSIPATION: 0.95,   // per 60Hz frame
      VELOCITY_DISSIPATION: 0.95,
      PRESSURE: 0.1,
      CURL: 50,
      SPLAT_RADIUS: 0.5 / 100,
      SPLAT_FORCE: 5,              // dye/velocity per CSS px of pointer travel
      DT: 0.016,
      SEA_SCALE: opts.touch ? 0.4 : 0.5,   // sea texture size relative to the canvas (it is soft; half is plenty)
      SEA_MAX_W: opts.touch ? 1024 : 1600,
      DPR: Math.min(window.devicePixelRatio || 1, opts.touch ? 1.5 : 2)
    };
    var look = {
      scale: opts.scale != null ? opts.scale : 3.0,     // noise cells across the frame's height
      height: opts.height != null ? opts.height : 0.45, // slope of the water
      shine: opts.shine != null ? opts.shine : 24.0,    // specular exponent (broad, wet gloss)
      ridge: opts.ridge != null ? opts.ridge : 1.0,     // 0 rounded swell … 1 sharp crests
      gain: opts.gain != null ? opts.gain : 0.42,       // amplitude falloff per octave
      lacunarity: opts.lacunarity != null ? opts.lacunarity : 2.0, // frequency step per octave
      cell: opts.cell != null ? opts.cell : 0.25,       // how much pitting (Voronoi bowls) sits on the rolling FBM
      cellScale: opts.cellScale != null ? opts.cellScale : 2.4, // pit frequency relative to the FBM scale
      persp: opts.persp != null ? opts.persp : 1.7,     // how much smaller the chop is at the top of the frame
      dim: opts.dim != null ? opts.dim : 0.8            // the 20% black veil flotnoir lays on top
    };

    var bg = opts.bg || [0.067, 0.067, 0.063];
    var ink = opts.ink || [0.95, 0.93, 0.88];
    var fade = 1, stormTarget = 0, stormLevel = 0;

    var vs = compileShader(gl, gl.VERTEX_SHADER, BASE_VS);
    var P = {
      copy: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, COPY_FS)),
      clear: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, CLEAR_FS)),
      splat: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, SPLAT_FS)),
      advection: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, ADVECTION_FS, ext.supportLinearFiltering ? [] : ['MANUAL_FILTERING'])),
      divergence: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, DIVERGENCE_FS)),
      curl: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, CURL_FS)),
      vorticity: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, VORTICITY_FS)),
      pressure: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, PRESSURE_FS)),
      gradient: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FS)),
      sea: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, SEA_FS)),
      composite: createProgram(gl, vs, compileShader(gl, gl.FRAGMENT_SHADER, COMPOSITE_FS))
    };

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
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture: texture, fbo: fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w, h, i, f, t, p) {
      var fbo1 = createFBO(w, h, i, f, t, p), fbo2 = createFBO(w, h, i, f, t, p);
      return { width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
        get read() { return fbo1; }, set read(v) { fbo1 = v; },
        get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap: function () { var t2 = fbo1; fbo1 = fbo2; fbo2 = t2; } };
    }

    function deleteFBO(t) { if (!t) return; gl.deleteTexture(t.texture); gl.deleteFramebuffer(t.fbo); }
    function deleteDoubleFBO(t) { if (!t) return; deleteFBO(t.read); deleteFBO(t.write); }

    function getResolution(resolution) {
      var aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      var min = Math.round(resolution), max = Math.round(resolution * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    var dye, velocity, divergence, curl, pressure, sea;
    function initFramebuffers() {
      var simRes = getResolution(config.SIM_RES), dyeRes = getResolution(config.DYE_RES);
      var texType = ext.halfFloatTexType, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
      var filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      deleteDoubleFBO(dye); deleteDoubleFBO(velocity); deleteDoubleFBO(pressure); deleteFBO(divergence); deleteFBO(curl); deleteFBO(sea);
      dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      var sw = Math.min(config.SEA_MAX_W, Math.round(gl.drawingBufferWidth * config.SEA_SCALE));
      var sh = Math.max(1, Math.round(sw * gl.drawingBufferHeight / gl.drawingBufferWidth));
      sea = createFBO(sw, sh, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    }

    function resizeCanvas() {
      var w = Math.max(1, Math.floor(canvas.clientWidth * config.DPR)), h = Math.max(1, Math.floor(canvas.clientHeight * config.DPR));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    }

    resizeCanvas();
    initFramebuffers();

    var destroyed = false;
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); destroyed = true;
      if (typeof opts.onLost === 'function') opts.onLost();
    }, false);

    /* ---------- fluid ---------- */

    // x,y in 0..1 (y up); dx,dy already in dye units; radius in texcoord units
    function splat(x, y, dx, dy, radius) {
      P.splat.bind();
      gl.uniform1i(P.splat.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(P.splat.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(P.splat.uniforms.point, x, y);
      gl.uniform3f(P.splat.uniforms.color, dx, dy, 1.0);
      gl.uniform1f(P.splat.uniforms.radius, radius);
      blit(velocity.write); velocity.swap();
      gl.uniform1i(P.splat.uniforms.uTarget, dye.read.attach(0));
      blit(dye.write); dye.swap();
    }

    function step(dt) {
      var frames = dt / config.DT;   // dissipation is specified per 60Hz frame
      var vDiss = Math.pow(config.VELOCITY_DISSIPATION, frames), dDiss = Math.pow(config.DENSITY_DISSIPATION, frames);

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

      P.clear.bind();
      gl.uniform1i(P.clear.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(P.clear.uniforms.value, config.PRESSURE);
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
      gl.uniform1f(P.advection.uniforms.dissipation, vDiss);
      blit(velocity.write); velocity.swap();

      if (!ext.supportLinearFiltering) gl.uniform2f(P.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(P.advection.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(P.advection.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(P.advection.uniforms.dissipation, dDiss);
      blit(dye.write); dye.swap();
    }

    /* ---------- picture ---------- */

    function drawSea(time) {
      P.sea.bind();
      gl.uniform1f(P.sea.uniforms.uAspect, sea.width / sea.height);
      gl.uniform1f(P.sea.uniforms.uTime, time);
      gl.uniform1f(P.sea.uniforms.uStorm, stormLevel);
      gl.uniform1f(P.sea.uniforms.uScale, look.scale);
      gl.uniform1f(P.sea.uniforms.uHeight, look.height);
      gl.uniform1f(P.sea.uniforms.uShine, look.shine);
      gl.uniform1f(P.sea.uniforms.uRidge, look.ridge);
      gl.uniform1f(P.sea.uniforms.uGain, look.gain);
      gl.uniform1f(P.sea.uniforms.uLacunarity, look.lacunarity);
      gl.uniform1f(P.sea.uniforms.uCell, look.cell);
      gl.uniform1f(P.sea.uniforms.uCellScale, look.cellScale);
      gl.uniform1f(P.sea.uniforms.uPersp, look.persp);
      blit(sea);
    }

    function composite() {
      P.composite.bind();
      gl.uniform1i(P.composite.uniforms.tSea, sea.attach(0));
      gl.uniform1i(P.composite.uniforms.tFluid, dye.read.attach(1));
      gl.uniform3f(P.composite.uniforms.uBg, bg[0], bg[1], bg[2]);
      gl.uniform3f(P.composite.uniforms.uInk, ink[0], ink[1], ink[2]);
      gl.uniform1f(P.composite.uniforms.uFade, fade);
      gl.uniform1f(P.composite.uniforms.uDim, look.dim);
      blit(null);
    }

    /* ---------- loop ---------- */

    var running = true, last = performance.now(), time = opts.time || 0;
    var splats = [], pendingPointer = null, lastPointer = null, gustTimer = 0;

    function gust(dt) {
      // While the storm is on, random shoves keep the water churning
      if (stormTarget < 1) return;
      gustTimer -= dt;
      if (gustTimer > 0) return;
      gustTimer = 0.05 + Math.random() * 0.08;
      var a = Math.random() * Math.PI * 2, f = (140 + Math.random() * 160) * config.SPLAT_FORCE;
      splats.push({ x: Math.random(), y: Math.random(), dx: Math.cos(a) * f, dy: Math.sin(a) * f, radius: config.SPLAT_RADIUS * 3 });
    }

    function frame(now) {
      if (destroyed) return;
      requestAnimationFrame(frame);
      if (!running) { last = now; return; }
      var dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      if (dt <= 0) return;
      if (resizeCanvas()) initFramebuffers();
      time += dt;
      stormLevel += (stormTarget - stormLevel) * (1 - Math.exp(-dt * 2.5));
      gust(dt);
      if (pendingPointer) { splats.push(pendingPointer); pendingPointer = null; }
      while (splats.length) { var s = splats.shift(); splat(s.x, s.y, s.dx, s.dy, s.radius || config.SPLAT_RADIUS); }
      step(dt);
      drawSea(time);
      composite();
    }
    requestAnimationFrame(frame);

    return {
      pointer: function (px, py, dx, dy) {
        // Movement is accumulated and released as one splat per frame, so a
        // high-rate mouse does not multiply the GPU work.
        var x = px / canvas.clientWidth, y = 1 - py / canvas.clientHeight;
        var ddx = dx * config.SPLAT_FORCE, ddy = -dy * config.SPLAT_FORCE;
        lastPointer = { x: x, y: y };
        if (Math.abs(ddx) + Math.abs(ddy) === 0) return;
        if (pendingPointer) { pendingPointer.x = x; pendingPointer.y = y; pendingPointer.dx += ddx; pendingPointer.dy += ddy; }
        else pendingPointer = { x: x, y: y, dx: ddx, dy: ddy };
      },
      scroll: function (velocityPx) {
        var v = Math.max(-1, Math.min(1, velocityPx / 60));
        if (Math.abs(v) < 0.05) return;
        var x = lastPointer ? lastPointer.x : 0.5, y = lastPointer ? lastPointer.y : 0.5;
        splats.push({ x: x, y: y, dx: (Math.random() - 0.5) * 40 * v * config.SPLAT_FORCE, dy: v * 120 * config.SPLAT_FORCE, radius: config.SPLAT_RADIUS * 4 });
      },
      setInk: function (rgb) { ink = rgb; },
      setBg: function (rgb) { bg = rgb; },
      setFade: function (f) { fade = f; },
      storm: function (on) { stormTarget = on ? 1 : 0; },
      pause: function () { running = false; },
      resume: function () { running = true; last = performance.now(); },
      isRunning: function () { return running; },
      destroy: function () { destroyed = true; },
      _look: look
    };
  }

  root.Sea = { create: create };
})(window);
