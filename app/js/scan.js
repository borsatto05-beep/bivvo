/* Bivvo Scan 4.0 — One Shot Intelligence.
   - captura guiada com câmera ao vivo quando o navegador permite;
   - análise local de iluminação, nitidez, estabilidade e enquadramento;
   - auto-disparo opcional quando a imagem fica estável e legível;
   - corte automático do papel + correção de perspectiva quando o contorno é confiável;
   - versões colorida, alto contraste e detalhe da zona provável do total;
   - QR Code detectado localmente quando a Web API estiver disponível;
   - nenhuma imagem é persistida pelo Bivvo. */
import * as cloud from './cloud.js';
import { setUsage } from './plans.js';

const MAX_COLOR = 2200;
const MAX_ENHANCED = 1800;
const MAX_DETAIL = 1200;
const MAX_REGION = 1050;
const MAX_BODY_CHARS = 4_650_000;
const LIVE_SAMPLE = 220;
const capturedQr = new WeakMap();
const yieldFrame = () => new Promise(resolve => setTimeout(resolve,0));

export function pickImage({ camera = true } = {}) {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*';
    if (camera) input.setAttribute('capture', 'environment');
    let done = false;
    const finish = value => { if (done) return; done = true; resolve(value); };
    input.addEventListener('change', () => finish(input.files && input.files[0] ? input.files[0] : null), { once: true });
    window.addEventListener('focus', () => setTimeout(() => { if (!input.files || !input.files.length) finish(null); }, 900), { once: true });
    input.click();
  });
}

export function supportsSmartCamera() {
  return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function blobToB64(blob) {
  return blob.arrayBuffer().then(buf => {
    const u8 = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  });
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não consegui preparar a foto.')), 'image/jpeg', quality));
}

function dimsFor(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

function drawBitmap(bmp, max) {
  const [w, h] = dimsFor(bmp.width, bmp.height, max);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { alpha: false });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  x.drawImage(bmp, 0, 0, w, h);
  return c;
}

function percentile(values, q) {
  if (!values.length) return 0;
  const a = Array.from(values).sort((x, y) => x - y);
  const i = Math.max(0, Math.min(a.length - 1, Math.round((a.length - 1) * q)));
  return a[i];
}

function sampleCanvas(canvas, max = 180) {
  const [w, h] = dimsFor(canvas.width, canvas.height, max);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(canvas, 0, 0, w, h);
  return { canvas: c, ctx: x, width: w, height: h, data: x.getImageData(0, 0, w, h).data };
}

function analyzeCanvas(canvas, { checkResolution = true } = {}) {
  const s = sampleCanvas(canvas, 180);
  const d = s.data, w = s.width, h = s.height;
  const g = new Float32Array(w * h);
  let sum = 0, sum2 = 0, n = 0, dark = 0, bright = 0, glare = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    g[p] = y; sum += y; sum2 += y * y; n++;
    if (y < 38) dark++;
    if (y > 245) bright++;
    if (y > 252 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 12) glare++;
  }
  const mean = n ? sum / n : 0;
  const contrast = n ? Math.sqrt(Math.max(0, sum2 / n - mean * mean)) : 0;
  let edge = 0, edges = 0;
  for (let yy = 1; yy < h; yy++) for (let xx = 1; xx < w; xx++) {
    const p = yy * w + xx;
    edge += Math.abs(g[p] - g[p - 1]) + Math.abs(g[p] - g[p - w]);
    edges += 2;
  }
  edge = edges ? edge / edges : 0;
  const issues = [];
  if (checkResolution && Math.min(canvas.width, canvas.height) < 700) issues.push('low_resolution');
  if (mean < 48 || dark / Math.max(1, n) > 0.55) issues.push('too_dark');
  if (mean > 235 && bright / Math.max(1, n) > 0.72) issues.push('too_bright');
  if (glare / Math.max(1, n) > 0.08) issues.push('glare');
  if (contrast < 26) issues.push('low_contrast');
  if (edge < 5.2) issues.push('possibly_blurry');
  return {
    width: canvas.width, height: canvas.height,
    brightness: Math.round(mean), contrast: Math.round(contrast), edge: Math.round(edge * 10) / 10,
    glareRatio: Math.round((glare / Math.max(1, n)) * 1000) / 1000,
    issues
  };
}

function frameSignature(canvas) {
  const s = sampleCanvas(canvas, 72), d = s.data, out = new Uint8Array(s.width * s.height);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) out[p] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  return out;
}

function frameMotion(a, b) {
  if (!a || !b || a.length !== b.length) return 99;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function quadArea(q) {
  let a = 0;
  for (let i = 0; i < 4; i++) { const p = q[i], n = q[(i + 1) % 4]; a += p.x * n.y - n.x * p.y; }
  return Math.abs(a) / 2;
}

/* Detecta a maior área clara/neutra que se parece com uma folha. O resultado só é usado
   quando a confiança geométrica é alta; caso contrário preservamos a foto inteira. */
function detectPaperQuad(canvas) {
  const s = sampleCanvas(canvas, 180), d = s.data, w = s.width, h = s.height;
  const lum = new Uint8Array(w * h), chroma = new Uint8Array(w * h), vals = [];
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const y = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    lum[p] = y; chroma[p] = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
    if ((p % 3) === 0) vals.push(y);
  }
  const med = percentile(vals, .5), p82 = percentile(vals, .82);
  const threshold = Math.max(128, Math.min(238, Math.round((med + p82) / 2 + 6)));
  const mask = new Uint8Array(w * h);
  for (let p = 0; p < mask.length; p++) if (lum[p] >= threshold && chroma[p] < 70) mask[p] = 1;

  const seen = new Uint8Array(mask.length), qx = new Int16Array(mask.length), qy = new Int16Array(mask.length);
  let best = null;
  for (let sy = 0; sy < h; sy += 2) for (let sx = 0; sx < w; sx += 2) {
    const start = sy * w + sx;
    if (!mask[start] || seen[start]) continue;
    let head = 0, tail = 0; qx[tail] = sx; qy[tail] = sy; tail++; seen[start] = 1;
    let count = 0, minX = sx, maxX = sx, minY = sy, maxY = sy;
    let tl = { x: sx, y: sy, v: sx + sy }, tr = { x: sx, y: sy, v: sx - sy }, br = { x: sx, y: sy, v: sx + sy }, bl = { x: sx, y: sy, v: sx - sy };
    while (head < tail) {
      const x = qx[head], y = qy[head]; head++; count++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      const sum = x + y, diff = x - y;
      if (sum < tl.v) tl = { x, y, v: sum };
      if (diff > tr.v) tr = { x, y, v: diff };
      if (sum > br.v) br = { x, y, v: sum };
      if (diff < bl.v) bl = { x, y, v: diff };
      const nb = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const p = ny * w + nx;
        if (mask[p] && !seen[p]) { seen[p] = 1; qx[tail] = nx; qy[tail] = ny; tail++; }
      }
    }
    if (!best || count > best.count) best = { count, minX, maxX, minY, maxY, quad: [tl, tr, br, bl] };
  }
  if (!best) return null;
  const frac = best.count / (w * h), bw = best.maxX - best.minX + 1, bh = best.maxY - best.minY + 1;
  const fill = best.count / Math.max(1, bw * bh), ratio = bw / Math.max(1, bh);
  const touches = Number(best.minX <= 1) + Number(best.minY <= 1) + Number(best.maxX >= w - 2) + Number(best.maxY >= h - 2);
  if (frac < .12 || frac > .94 || fill < .42 || ratio < .18 || ratio > 2.2 || touches >= 3) return null;
  const sx = canvas.width / w, sy = canvas.height / h;
  const quad = best.quad.map(p => ({ x: p.x * sx, y: p.y * sy }));
  const area = quadArea(quad) / (canvas.width * canvas.height);
  if (area < .11 || area > .96) return null;
  return { quad, coverage: area, fill, ratio };
}

function perspectiveCoefficients(q) {
  const [tl, tr, br, bl] = q;
  const dx1 = tr.x - br.x, dx2 = bl.x - br.x, dx3 = tl.x - tr.x + br.x - bl.x;
  const dy1 = tr.y - br.y, dy2 = bl.y - br.y, dy3 = tl.y - tr.y + br.y - bl.y;
  let g = 0, h = 0;
  const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(dx3) > .001 || Math.abs(dy3) > .001) {
    if (Math.abs(den) < .0001) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
  }
  return {
    a: tr.x - tl.x + g * tr.x,
    b: bl.x - tl.x + h * bl.x,
    c: tl.x,
    d: tr.y - tl.y + g * tr.y,
    e: bl.y - tl.y + h * bl.y,
    f: tl.y,
    g, h
  };
}

async function warpPaper(source, detected) {
  if (!detected || !detected.quad) return null;
  const q = detected.quad;
  const outW0 = Math.max(dist(q[0], q[1]), dist(q[3], q[2]));
  const outH0 = Math.max(dist(q[0], q[3]), dist(q[1], q[2]));
  if (!(outW0 > 180 && outH0 > 260)) return null;
  const scale = Math.min(1, 1900 / Math.max(outW0, outH0));
  const outW = Math.max(1, Math.round(outW0 * scale)), outH = Math.max(1, Math.round(outH0 * scale));
  const coeff = perspectiveCoefficients(q); if (!coeff) return null;
  const srcCtx = source.getContext('2d', { willReadFrequently: true });
  const src = srcCtx.getImageData(0, 0, source.width, source.height), sd = src.data;
  const out = document.createElement('canvas'); out.width = outW; out.height = outH;
  const outCtx = out.getContext('2d', { alpha: false, willReadFrequently: true });
  const img = outCtx.createImageData(outW, outH), od = img.data;
  const { a,b,c,d,e,f,g,h } = coeff;
  for (let y = 0; y < outH; y++) {
    if (y && y % 128 === 0) await new Promise(resolve => setTimeout(resolve,0));
    const v = outH <= 1 ? 0 : y / (outH - 1);
    for (let x = 0; x < outW; x++) {
      const u = outW <= 1 ? 0 : x / (outW - 1), den = g * u + h * v + 1;
      const sx = (a * u + b * v + c) / den, sy = (d * u + e * v + f) / den;
      const ix = Math.max(0, Math.min(source.width - 1, Math.round(sx))), iy = Math.max(0, Math.min(source.height - 1, Math.round(sy)));
      const si = (iy * source.width + ix) * 4, oi = (y * outW + x) * 4;
      od[oi] = sd[si]; od[oi+1] = sd[si+1]; od[oi+2] = sd[si+2]; od[oi+3] = 255;
    }
  }
  outCtx.putImageData(img, 0, 0);
  return out;
}

function enhanceReceipt(source, max = MAX_ENHANCED) {
  const [w, h] = dimsFor(source.width, source.height, max);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { alpha: false, willReadFrequently: true });
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(source, 0, 0, w, h);
  const im = x.getImageData(0, 0, w, h), d = im.data;

  // Mapa de iluminação desfocado para compensar sombras e papel térmico desigual.
  const shade = document.createElement('canvas'); shade.width = w; shade.height = h;
  const sx = shade.getContext('2d', { alpha: false, willReadFrequently: true });
  sx.filter = 'grayscale(1) blur(18px)'; sx.drawImage(c, 0, 0); sx.filter = 'none';
  const bg = sx.getImageData(0, 0, w, h).data;
  const hist = new Uint32Array(256), gray = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const y0 = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const b0 = Math.max(42, 0.299 * bg[i] + 0.587 * bg[i + 1] + 0.114 * bg[i + 2]);
    const y = Math.max(0, Math.min(255, y0 * 225 / b0));
    gray[p] = y; hist[Math.round(y)]++;
  }
  const total = w * h;
  let lo = 0, hi = 255, acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * .012) { lo = i; break; } }
  acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * .988) { hi = i; break; } }
  if (hi - lo < 65) { lo = Math.max(0, lo - 22); hi = Math.min(255, hi + 22); }
  const span = Math.max(1, hi - lo);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    let y = (gray[p] - lo) * 255 / span;
    y = Math.max(0, Math.min(255, (y - 128) * 1.18 + 128));
    d[i] = d[i+1] = d[i+2] = y; d[i+3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c;
}

function regionDetail(source, yStart, yEnd, max = MAX_REGION) {
  const sy = Math.max(0, Math.min(source.height - 1, Math.round(source.height * yStart)));
  const ey = Math.max(sy + 1, Math.min(source.height, Math.round(source.height * yEnd)));
  const h0 = ey - sy;
  const [w, h] = dimsFor(source.width, h0, max);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { alpha: false });
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  x.drawImage(source, 0, sy, source.width, h0, 0, 0, w, h);
  return enhanceReceipt(c, max);
}
function totalDetail(source, max = MAX_DETAIL) { return regionDetail(source, .42, 1, max); }
function headerDetail(source, max = MAX_REGION) { return regionDetail(source, 0, .38, max); }
function centerDetail(source, max = MAX_REGION) { return regionDetail(source, .18, .78, max); }

function parseTlv(raw) {
  const out = {};
  let i = 0;
  while (i + 4 <= raw.length) {
    const id = raw.slice(i, i + 2), len = Number(raw.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(len) || len < 0 || i + 4 + len > raw.length) break;
    out[id] = raw.slice(i + 4, i + 4 + len); i += 4 + len;
  }
  return out;
}
function parsePixQr(raw) {
  const top = parseTlv(String(raw || ''));
  let pix = false;
  for (let n = 26; n <= 51; n++) {
    const tag = String(n).padStart(2, '0');
    if (!top[tag]) continue;
    const sub = parseTlv(top[tag]);
    if (String(sub['00'] || '').toLowerCase() === 'br.gov.bcb.pix') { pix = true; break; }
  }
  if (!pix && !/br\.gov\.bcb\.pix/i.test(String(raw || ''))) return null;
  const amount = Number(String(top['54'] || '').replace(',', '.'));
  return {
    amount: Number.isFinite(amount) && amount > 0 && amount < 1e7 ? Math.round(amount * 100) / 100 : null,
    merchantName: String(top['59'] || '').trim().slice(0, 70) || null,
    merchantCity: String(top['60'] || '').trim().slice(0, 50) || null
  };
}

async function detectQr(canvas, { fast = false } = {}) {
  let raw = '';
  try {
    if (typeof window.BarcodeDetector === 'function') {
      const detector = new window.BarcodeDetector({formats:['qr_code']});
      raw = String((await detector.detect(canvas))[0]?.rawValue || '').trim();
    }
  } catch { /* leitor alternativo */ }
  if (!raw) {
    try {
      await import('./vendor/jsqr.js');
      const regions = [[0,0,1,1,fast?1100:1600]];
      if(!fast) regions.push([0,0,1,1,2600],[0,.35,1,.65,2200],[0,0,.65,.65,1600],[.35,0,.65,.65,1600],[0,.35,.65,.65,1600],[.35,.35,.65,.65,1600]);
      for (const [left,top,width,height,max] of regions) {
        const sw=Math.round(canvas.width*width),sh=Math.round(canvas.height*height),[w,h]=dimsFor(sw,sh,max);
        const c=document.createElement('canvas');c.width=w;c.height=h;
        const ctx=c.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(canvas,Math.round(canvas.width*left),Math.round(canvas.height*top),sw,sh,0,0,w,h);
        const pixels=ctx.getImageData(0,0,w,h),found=window.jsQR(pixels.data,w,h,{inversionAttempts:'attemptBoth'});
        if(found){raw=found.data;break;}
        await yieldFrame();
      }
    } catch { /* leitura visual permanece disponível */ }
  }
  if(!raw)return {detected:false};
  const pix=parsePixQr(raw);let urlHost=null;
  try{urlHost=new URL(raw).hostname;}catch{}
  return {detected:true,raw:raw.slice(0,4096),kind:pix?'pix_qr':urlHost?'nfce_url':'qr_detected',amount:pix?.amount||null,merchantName:pix?.merchantName||null,urlHost};
}

async function encodeVariants(colorCanvas, enhancedCanvas, headerCanvas, centerCanvas, detailCanvas, quality = { color:.84, enhanced:.79, header:.76, center:.76, detail:.76 }) {
  const blobs = await Promise.all([
    canvasBlob(colorCanvas, quality.color), canvasBlob(enhancedCanvas, quality.enhanced), canvasBlob(headerCanvas, quality.header), canvasBlob(centerCanvas, quality.center), canvasBlob(detailCanvas, quality.detail)
  ]);
  const data = await Promise.all(blobs.map(blobToB64));
  return [
    { mediaType:'image/jpeg', image:data[0], variant:'color' },
    { mediaType:'image/jpeg', image:data[1], variant:'enhanced' },
    { mediaType:'image/jpeg', image:data[2], variant:'header_detail' },
    { mediaType:'image/jpeg', image:data[3], variant:'center_detail' },
    { mediaType:'image/jpeg', image:data[4], variant:'total_detail' }
  ];
}

function rescaleCanvas(source, max) {
  const [w, h] = dimsFor(source.width, source.height, max);
  if (w === source.width && h === source.height) return source;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { alpha: false }); x.fillStyle = '#fff'; x.fillRect(0,0,w,h); x.drawImage(source,0,0,w,h); return c;
}

export async function prepareReceiptImage(file) {
  if (!file || !/^image\//.test(file.type || 'image/jpeg')) throw new Error('Escolha uma foto do comprovante.');
  if (file.size > 15e6) throw new Error('Escolha uma imagem de até 15 MB.');
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation:'from-image' }); }
  catch { try { bmp = await createImageBitmap(file); } catch { bmp = null; } }
  if (!bmp) throw new Error('Não consegui abrir esta imagem. Tente uma foto JPG, PNG ou WebP.');
  // Decodificar QR antes de reduzir a foto: os módulos pequenos precisam dos pixels originais.
  const qrSource = drawBitmap(bmp,3600);
  let qr = capturedQr.get(file) || await detectQr(qrSource);
  let full = drawBitmap(bmp, MAX_COLOR); if (bmp.close) bmp.close();
  const detected = detectPaperQuad(full);
  const warped = detected ? await warpPaper(full, detected) : null;
  let color = warped || full;
  if (Math.max(color.width, color.height) > MAX_COLOR) color = rescaleCanvas(color, MAX_COLOR);
  let diagnostics = analyzeCanvas(color);
  diagnostics.paperCoverage = detected ? Math.round(detected.coverage * 1000) / 1000 : null;
  diagnostics.autoCrop = !!warped;
  diagnostics.perspectiveCorrected = !!warped;
  diagnostics.aspectRatio = Math.round((color.width / Math.max(1, color.height)) * 1000) / 1000;
  if (!warped) diagnostics.issues.push('no_confident_crop');
  if (!qr.detected && warped) qr = await detectQr(color);

  let enhanced = enhanceReceipt(color), header = headerDetail(color), center = centerDetail(color), detail = totalDetail(color);
  let images = await encodeVariants(warped ? full : color, enhanced, header, center, detail);
  let bodySize = JSON.stringify({ images, diagnostics, qr }).length;

  if (bodySize > MAX_BODY_CHARS) {
    color = rescaleCanvas(color, 1900); enhanced = enhanceReceipt(color, 1600); header = headerDetail(color, 900); center = centerDetail(color, 900); detail = totalDetail(color, 1000);
    diagnostics = { ...analyzeCanvas(color), paperCoverage:diagnostics.paperCoverage, autoCrop:diagnostics.autoCrop, perspectiveCorrected:diagnostics.perspectiveCorrected, aspectRatio:diagnostics.aspectRatio, issues:diagnostics.issues };
    images = await encodeVariants(warped ? rescaleCanvas(full,1900) : color, enhanced, header, center, detail, { color:.79, enhanced:.75, header:.72, center:.72, detail:.73 });
    bodySize = JSON.stringify({ images, diagnostics, qr }).length;
  }
  if (bodySize > MAX_BODY_CHARS) {
    // Mantém documento completo + contraste + centro + total; cabeçalho é o primeiro a sair.
    images = images.filter(x => x.variant !== 'header_detail');
    bodySize = JSON.stringify({ images, diagnostics, qr }).length;
  }
  if (bodySize > MAX_BODY_CHARS) {
    images = images.filter(x => x.variant !== 'center_detail');
    bodySize = JSON.stringify({ images, diagnostics, qr }).length;
  }
  if (bodySize > MAX_BODY_CHARS) throw new Error('A foto ficou grande demais para preparar. O Bivvo já tentou reduzir automaticamente.');
  return { images, diagnostics, qr };
}

export async function shrink(file) {
  const p = await prepareReceiptImage(file);
  return p.images[0];
}

function liveCanvas(video, max = LIVE_SAMPLE) {
  const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
  const [w,h] = dimsFor(vw,vh,max);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  c.getContext('2d',{alpha:false}).drawImage(video,0,0,w,h); return c;
}

function qualityMessage(diag, motion, paper) {
  if (motion > 9) return ['Segure firme por um instante', 'warn'];
  if (diag.issues.includes('too_dark')) return ['Está escuro — procure mais luz', 'warn'];
  if (diag.issues.includes('glare') || diag.issues.includes('too_bright')) return ['Evite reflexo direto no papel', 'warn'];
  if (diag.issues.includes('possibly_blurry')) return ['Aproxime e espere o foco', 'warn'];
  if (paper && paper.coverage < .22) return ['Aproxime o comprovante', 'warn'];
  if (diag.contrast < 20) return ['Pouco contraste — mude o ângulo', 'warn'];
  return ['Ótimo enquadramento — mantenha firme', 'good'];
}

async function captureTrackPhoto(track, video) {
  try {
    if ('ImageCapture' in window) {
      const ic = new window.ImageCapture(track);
      const blob = await ic.takePhoto();
      if (blob && blob.size > 10000) return blob;
    }
  } catch { /* fallback para frame do vídeo */ }
  const c = document.createElement('canvas'); c.width = video.videoWidth || 1280; c.height = video.videoHeight || 720;
  c.getContext('2d',{alpha:false}).drawImage(video,0,0,c.width,c.height);
  return canvasBlob(c,.94);
}

export async function captureSmartReceipt() {
  if (!supportsSmartCamera()) return pickImage();
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal:'environment' }, width:{ ideal:1920 }, height:{ ideal:1080 } }, audio:false });
  } catch { return pickImage(); }
  const track = stream.getVideoTracks()[0];
  try {
    const caps = track.getCapabilities ? track.getCapabilities() : {};
    if (caps.focusMode && caps.focusMode.includes('continuous')) await track.applyConstraints({ advanced:[{ focusMode:'continuous' }] });
  } catch { /* ignore */ }

  return new Promise(resolve => {
    let finished=false, timer=null, prevSig=null, goodFrames=0, busy=false, torch=false, qrBusy=false, liveQr=null, liveQrAt=0;
    const stop = value => {
      if (finished) return; finished=true; if (timer) clearInterval(timer);
      try { track.stop(); } catch {}
      try { stream.getTracks().forEach(t=>t.stop()); } catch {}
      document.removeEventListener("keydown",keyHandler);
      overlay.remove(); previousFocus?.focus?.(); resolve(value || null);
    };
    const previousFocus=document.activeElement;
    const keyHandler=e=>{
      if(e.key==='Escape') {e.preventDefault();stop(null);}
      if(e.key==='Tab') {
        const focusables=Array.from(overlay.querySelectorAll("button")).filter(x=>!x.hidden&&!x.disabled);
        const first=focusables[0],last=focusables.at(-1);
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",keyHandler);
    const overlay=document.createElement('div'); overlay.className='scan-camera-overlay'; overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Scanner inteligente de comprovante');
    const header=document.createElement('div'); header.className='scan-camera-head';
    const title=document.createElement('div'); const titleB=document.createElement('b'); titleB.textContent='Scanner inteligente'; const titleS=document.createElement('small'); titleS.textContent='Enquadre o comprovante inteiro. A foto não fica salva.'; title.append(titleB,titleS);
    const close=document.createElement('button'); close.type='button'; close.className='scan-camera-close'; close.textContent='×'; close.setAttribute('aria-label','Fechar câmera'); close.onclick=()=>stop(null);
    header.append(title,close);
    const stage=document.createElement('div'); stage.className='scan-camera-stage';
    const video=document.createElement('video'); video.className='scan-camera-video'; video.playsInline=true; video.muted=true; video.autoplay=true; video.srcObject=stream;
    const frame=document.createElement('div'); frame.className='scan-camera-frame'; for(let i=0;i<4;i++) frame.append(document.createElement('i'));
    const guide=document.createElement('div'); guide.className='scan-camera-guide'; guide.textContent='Preparando câmera…';
    stage.append(video,frame,guide);
    const meter=document.createElement('div'); meter.className='scan-camera-meter'; for(let i=0;i<5;i++) meter.append(document.createElement('span'));
    const footer=document.createElement('div'); footer.className='scan-camera-actions';
    const gallery=document.createElement('button'); gallery.type='button'; gallery.className='btn ghost'; gallery.textContent='Galeria'; gallery.onclick=async()=>{ const f=await pickImage({camera:false}); if(f) stop(f); };
    const shoot=document.createElement('button'); shoot.type='button'; shoot.className='scan-camera-shutter'; shoot.setAttribute('aria-label','Tirar foto');
    const caps=track.getCapabilities ? track.getCapabilities() : {};
    const torchBtn=document.createElement('button'); torchBtn.type='button'; torchBtn.className='btn ghost'; torchBtn.textContent='Luz'; torchBtn.hidden=!caps.torch;
    torchBtn.onclick=async()=>{ try { torch=!torch; await track.applyConstraints({advanced:[{torch}]}); torchBtn.classList.toggle('active',torch); } catch {} };
    footer.append(gallery,shoot,torchBtn);
    overlay.append(header,stage,meter,footer); document.body.append(overlay); close.focus();
    const capture=async(auto=false)=>{ if(busy||finished)return; busy=true; guide.textContent=auto?'Imagem boa — capturando…':'Capturando…'; try { const b=await captureTrackPhoto(track,video); const file=new File([b],`comprovante-${Date.now()}.jpg`,{type:b.type||'image/jpeg'}); if(liveQr && Date.now()-liveQrAt<1800)capturedQr.set(file,liveQr); stop(file); } catch { busy=false; guide.textContent='Não consegui capturar. Toque novamente.'; } };
    shoot.onclick=()=>capture(false);
    video.play().catch(()=>{});
    timer=setInterval(async()=>{
      if(finished||busy||video.readyState<2||!video.videoWidth)return;
      const c=liveCanvas(video), diag=analyzeCanvas(c,{checkResolution:false}), sig=frameSignature(c), motion=frameMotion(prevSig,sig); prevSig=sig;
      const paper=detectPaperQuad(c), [msg,tone]=qualityMessage(diag,motion,paper);
      guide.textContent=liveQr && Date.now()-liveQrAt<1800?'QR identificado — segure firme':msg; guide.dataset.tone=tone;
      const good = tone==='good' && motion<7.2 && diag.edge>=5.4 && diag.contrast>=20 && diag.brightness>48 && diag.brightness<238;
      goodFrames=good?Math.min(5,goodFrames+1):0;
      Array.from(meter.children).forEach((el,i)=>el.classList.toggle('on',i<goodFrames));
      frame.classList.toggle('good',goodFrames>=2);
      // Não disparar antes de conseguir enxergar o QR. O botão manual continua disponível.
      if(!qrBusy && motion<8){
        qrBusy=true;try{const q=await detectQr(liveCanvas(video,1600),{fast:true});if(q.detected){liveQr=q;liveQrAt=Date.now();}}finally{qrBusy=false;}
      }
      if(goodFrames>=5 && liveQr && Date.now()-liveQrAt<1800) capture(true);
      else if(goodFrames>=5)guide.textContent='Aproxime do QR ou toque para fotografar o comprovante inteiro.';
    },260);
  });
}

/* Retorna { ok, data } ou { ok:false, code, error, usage } */
function qrFields(qr) {
  const data={merchant:null,date:null,value:null};
  if(qr?.kind==='pix_qr'){data.merchant=qr.merchantName||null;data.value=qr.amount||null;}
  try{
    const u=new URL(qr?.raw),p=(u.searchParams.get('p')||'').split('|'),key=p[0];
    if(/^([a-z0-9-]+\.)*(fazenda|sefaz)\.[a-z]{2}\.gov\.br$/.test(u.hostname)&&/^\d{44}$/.test(key)&&key.slice(20,22)==='65'&&p[1]==='2'&&p.length>=8){
      const n=Number(p[4]);if(n>0&&n<1e7)data.value=Math.round(n*100)/100;
      const d=`20${key.slice(2,4)}-${key.slice(4,6)}-${p[3]}`;
      if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d)data.date=d;
    }
  }catch{}
  return data;
}

export async function readReceipt(file) {
  const prepared = await prepareReceiptImage(file);
  const localData = qrFields(prepared.qr);
  const {readLocalText}=await import('./receipt-ocr.js');
  // Texto local e consulta remota em paralelo; falha de um não apaga o outro.
  const textImage=prepared.images.find(x=>x.variant==='enhanced')||prepared.images[0];
  const textJob=readLocalText('data:'+textImage.mediaType+';base64,'+textImage.image);
  const ctrl = new AbortController(),timer=setTimeout(()=>ctrl.abort(),32000);
  let remote;
  try {
    const token=await cloud.accessToken();
    const r=await fetch('/api/scan-receipt',{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(prepared)});
    const j=await r.json().catch(()=>({}));
    if(j.usage)setUsage('scan',j.usage.used);
    remote={ok:r.ok,data:j.data,code:j.code||(!r.ok?'server_error':null),error:j.error,usage:j.usage,diagnostics:j.diagnostics};
  } catch(e){remote={ok:false,code:e.name==='AbortError'?'timeout':'network'};}
  finally{clearTimeout(timer);}
  const complete=remote.data && ['merchant','date','value'].every(k=>remote.data[k]!=null);
  const text=complete?{data:{},status:'not_needed'}:await textJob;
  const data={merchant:remote.data?.merchant||localData.merchant||text.data.merchant||null,date:remote.data?.date||localData.date||text.data.date||null,value:remote.data?.value??localData.value??text.data.value??null};
  const found=Object.values(data).filter(v=>v!=null).length;
  return {ok:found>0,data,code:remote.code,error:remote.error,usage:remote.usage,diagnostics:{qrDetected:!!prepared.qr.detected,qrStatus:remote.diagnostics?.qrStatus||(!prepared.qr.detected?'not_detected':'data_only'),remoteStatus:remote.code||'read',localTextStatus:text.status,fieldsFound:found}};
}

export const _test = { analyzeCanvas, detectPaperQuad, perspectiveCoefficients, quadArea, frameMotion, parseTlv, parsePixQr, detectQr, qrFields };
