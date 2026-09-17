"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Порт компонента MetallicPaint с reactbits.dev (автор David Haz),
 * лицензия MIT — https://github.com/DavidHDev/react-bits
 *
 * Как это работает:
 *  1. Картинка переводится в карту высот: по альфа-каналу строится силуэт,
 *     внутри силуэта решается уравнение диффузии (SOR, 200 итераций) —
 *     получается «толщина» фигуры. Центр фигуры глубокий, края тонкие.
 *  2. Карта высот уходит в WebGL2 как текстура: R — глубина, A — маска формы.
 *  3. Фрагментный шейдер рисует по этой глубине жидкий металл: полосы
 *     металлического отблеска, френель, хроматическое расщепление,
 *     контурная линия и волновое искажение. Выглядит как литая краска.
 *
 * Отличия от оригинала (осознанные):
 *  • TypeScript вместо JSX, изолированный CSS вместо отдельного файла;
 *  • размер карты высот ограничен пропсом maxSize — решатель квадратично
 *    дорогой, на 1000 px он заметно блокирует главный поток;
 *  • анимация встаёт, когда блок вне экрана или вкладка неактивна;
 *  • `prefers-reduced-motion` — один статичный кадр вместо бесконечной петли;
 *  • если WebGL2 недоступен или шейдер не собрался, показывается обычный <img>.
 *
 * SEO: канвас декоративный, подпись бренда задаётся через role="img"
 * и aria-label, а текстовый логотип в шапке сайта остаётся обычным HTML.
 *
 * ВНИМАНИЕ: шейдер скопирован дословно. Любая «косметическая» правка GLSL
 * легко ломает картинку — менять его нужно осознанно и проверяя результат.
 */

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;
vec3 sC,sM;
vec3 pW(vec3 v){
vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);
return s*c*((h*16.-4.)*c-1.);
}
vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}
vec2 fA(){
vec2 c=vP-.5;
c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;
c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;
return vec2(c.x+.5,.5-c.y);
}
vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}
float bM(vec2 c,float t){
vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);
return l.x*l.y*u.x*u.y;
}
float mG(float hi,float lo,float t,float sh,float cv){
sh*=(2.-u_sharp);
float ci=smoothstep(.15,.85,cv),r=lo;
float e1=.08/u_scale;
r=mix(r,hi,smoothstep(0.,sh*1.5,t));
r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));
float e2=e1+.05/u_scale*(1.-ci*.35);
r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));
float e3=e2+.025/u_scale*(1.-ci*.45);
r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));
float e4=e1+.1/u_scale;
r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));
float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);
r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));
return r;
}
void main(){
sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;
sM=fract(sC.zxy-sC.yzx*1.618);
vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);
float angleRad=u_angle*3.14159/180.;
sc=rot(sc-.5,angleRad)+.5;
sc=clamp(sc,0.,1.);
float sl=sc.x-sc.y,an=u_time*.001;
vec2 iC=fA();
vec4 texSample=texture(u_tex,iC);
float dp=texSample.r;
float shapeMask=texSample.a;
vec3 hi=u_lightColor*u_bright;
vec3 lo=u_darkColor*(2.-u_bright);
lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
vec2 fC=sc-.5;
float rd=length(fC+vec2(0.,sl*.15));
vec2 ag=rot(fC,(.22-sl*.18)*3.14159);
float cv=1.-pow(rd*1.65,1.15);
cv*=pow(sc.y,.35);
float vs=shapeMask;
vs*=bM(iC,.01);
float fr=pow(1.-cv,u_fresnel)*.3;
vs=min(vs+fr*vs,1.);
float mT=an*.0625;
vec3 wO=vec3(-1.05,1.35,1.55);
vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;
vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
vec2 nC=sc*45.*u_noise;
nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;
vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;
tC=lM(sC,tC);
tC=lM(sC+1.618,tC);
float tb=sin(tC.x*3.14159)*.5+.5;
tb=tb*2.-1.;
float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;
float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
float lD=dp+(1.-dp)*u_liquid*tb;
lD+=noiseVal*u_distort*.15*edgeFactor;
float rB=clamp(1.-cv,0.,1.);
float fl=ag.x+sl;
fl+=noiseVal*sl*u_distort*edgeFactor;
fl*=mix(1.,1.-dp*.5,u_contour);
fl-=dp*u_contour*.8;
float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);
fl-=tb*sl*1.8*eI;
float cA=cv*clamp(pow(sc.y,.12),.25,1.);
fl*=.12+(1.05-lD)*cA;
fl*=smoothstep(1.,.65,lD);
float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);
float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);
fl+=vA1*.16+vA2*.025;
fl*=.45+pow(sc.y,2.)*.55;
fl*=u_scale;
fl-=an;
float rO=rB+cv*tb*.025;
float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);
float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);
rO+=vM1*cM1*4.5;
rO-=sl;
float bO=rB*1.25;
float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);
float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);
bO+=vM2*cM2*.9;
bO-=lD*.18;
rO*=u_refract*u_chroma;
bO*=u_refract*u_chroma;
float sf=u_blur;
float rP=fract(fl+rO);
float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);
float gP=fract(fl);
float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);
float bP=fract(fl-bO);
float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
vec3 col=vec3(rC,gC,bC);
col=(col-.5)*u_contrast+.5;
col=clamp(col,0.,1.);
col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);
col=clamp(col,0.,1.);
oC=vec4(col*vs,vs);
}`;

export type MetallicLogoProps = {
  /**
   * Путь к логотипу. Файл должен быть на том же домене — картинка читается
   * через getImageData, и чужой домен без CORS-заголовков её «запачкает».
   */
  imageSrc?: string;
  /** Классы контейнера. Высоту задавать не нужно — её выведет aspect-ratio. */
  className?: string;
  /** Подпись для скринридеров. */
  label: string;
  /**
   * Пропорции файла (ширина / высота). Резервируют место до загрузки
   * картинки — иначе блок стартует с нулевой высоты и контент внизу
   * «прыгает» (CLS). После загрузки заменяются реальными пропорциями файла.
   */
  initialAspect?: number;
  seed?: number;
  scale?: number;
  refraction?: number;
  blur?: number;
  liquid?: number;
  /** Скорость течения металла. */
  speed?: number;
  brightness?: number;
  contrast?: number;
  angle?: number;
  fresnel?: number;
  lightColor?: string;
  darkColor?: string;
  patternSharpness?: number;
  waveAmplitude?: number;
  noiseScale?: number;
  chromaticSpread?: number;
  distortion?: number;
  contour?: number;
  tintColor?: string;
  /**
   * Верхняя граница разрешения карты высот. Решатель диффузии стоит
   * O(итерации × пиксели), поэтому 1000 px из оригинала заметно
   * подвешивает загрузку страницы — 768 даёт тот же вид и считается быстрее.
   */
  maxSize?: number;
};

/** Переводит картинку в карту высот: R — глубина, A — маска формы. */
function buildHeightMap(img: HTMLImageElement, maxSize: number): ImageData | null {
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  if (!naturalWidth || !naturalHeight) return null;

  const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const size = width * height;

  const alphaValues = new Float32Array(size);
  const shapeMask = new Uint8Array(size);
  const boundaryMask = new Uint8Array(size);

  for (let i = 0; i < size; i += 1) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // Белая непрозрачная заливка и полная прозрачность — это фон, не фигура.
    const isBackground = (r > 250 && g > 250 && b > 250 && a === 255) || a < 5;
    alphaValues[i] = isBackground ? 0 : a / 255;
    shapeMask[i] = alphaValues[i] > 0.1 ? 1 : 0;
  }

  // Пиксели на границе фигуры фиксируют нулевую высоту — от них «растекается» рельеф.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (!shapeMask[idx]) continue;

      if (
        x === 0 ||
        x === width - 1 ||
        y === 0 ||
        y === height - 1 ||
        !shapeMask[idx - 1] ||
        !shapeMask[idx + 1] ||
        !shapeMask[idx - width] ||
        !shapeMask[idx + width]
      ) {
        boundaryMask[idx] = 1;
      }
    }
  }

  // Решение уравнения Лапласа методом верхней релаксации: получаем «толщину» фигуры.
  const field = new Float32Array(size);
  const ITERATIONS = 200;
  const C = 0.01;
  const omega = 1.85;

  for (let iter = 0; iter < ITERATIONS; iter += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const idx = y * width + x;
        if (!shapeMask[idx] || boundaryMask[idx]) continue;

        const sum =
          (shapeMask[idx + 1] ? field[idx + 1] : 0) +
          (shapeMask[idx - 1] ? field[idx - 1] : 0) +
          (shapeMask[idx + width] ? field[idx + width] : 0) +
          (shapeMask[idx - width] ? field[idx - width] : 0);

        const newVal = (C + sum) / 4;
        field[idx] = omega * newVal + (1 - omega) * field[idx];
      }
    }
  }

  let maxVal = 0;
  for (let i = 0; i < size; i += 1) if (field[i] > maxVal) maxVal = field[i];
  if (maxVal === 0) maxVal = 1;

  const outData = ctx.createImageData(width, height);

  for (let i = 0; i < size; i += 1) {
    const px = i * 4;
    const depth = field[i] / maxVal;
    // Центр фигуры — тёмный (глубокий), края — светлые (тонкие).
    const gray = Math.round(255 * (1 - depth * depth));
    outData.data[px] = gray;
    outData.data[px + 1] = gray;
    outData.data[px + 2] = gray;
    outData.data[px + 3] = Math.round(alphaValues[i] * 255);
  }

  return outData;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
}

export default function MetallicLogo({
  imageSrc = "/Logo.png",
  className,
  label,
  initialAspect,
  seed = 42,
  scale = 4,
  refraction = 0.01,
  blur = 0.015,
  liquid = 0.75,
  speed = 0.3,
  brightness = 2,
  contrast = 0.5,
  angle = 0,
  fresnel = 1,
  lightColor = "#ffffff",
  darkColor = "#000000",
  patternSharpness = 1,
  waveAmplitude = 1,
  noiseScale = 0.5,
  chromaticSpread = 2,
  distortion = 1,
  contour = 0.2,
  tintColor = "#feb3ff",
  maxSize = 768,
}: MetallicLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  /** Готов ли контекст и программа — юниформы можно задавать только после этого. */
  const glReadyRef = useRef(false);
  /** Перерисовка одного кадра по требованию (например, после смены настроек). */
  const renderRef = useRef<(() => void) | null>(null);

  /** `image` — режим-заглушка: WebGL2 недоступен или шейдер не собрался. */
  const [mode, setMode] = useState<"webgl" | "image">("webgl");

  /**
   * Пропорции картинки берём из самого файла и подставляем в контейнер.
   *
   * Это принципиально: `fA()` в шейдере масштабирует картинку по принципу
   * «cover» — если пропорции канваса и картинки не совпадают, края обрежутся.
   * Поэтому контейнер всегда повторяет пропорции логотипа.
   */
  const [aspect, setAspect] = useState<number | null>(null);

  // Настройки анимации, которые не требуют пересоздания контекста.
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const initContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!gl) return false;

    const compile = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compile(VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compile(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return false;
    }

    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Шейдеры компилируются в программу — сами объекты больше не нужны.
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return false;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    glRef.current = gl;
    uniformsRef.current = uniforms;
    glReadyRef.current = true;
    return true;
  }, []);

  // Сборка контекста и программы — один раз на монтирование.
  useEffect(() => {
    if (!initContext()) {
      setMode("image");
      return;
    }
    return () => {
      const gl = glRef.current;
      renderRef.current = null;
      glReadyRef.current = false;
      if (!gl) return;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      glRef.current = null;
      uniformsRef.current = {};
    };
  }, [initContext]);

  // Значения юниформов: пересчитываются при изменении любого параметра.
  useEffect(() => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl || !glReadyRef.current || mode !== "webgl") return;

    gl.uniform1f(u.u_seed, seed);
    gl.uniform1f(u.u_scale, scale);
    gl.uniform1f(u.u_refract, refraction);
    gl.uniform1f(u.u_blur, blur);
    gl.uniform1f(u.u_liquid, liquid);
    gl.uniform1f(u.u_bright, brightness);
    gl.uniform1f(u.u_contrast, contrast);
    gl.uniform1f(u.u_angle, angle);
    gl.uniform1f(u.u_fresnel, fresnel);
    gl.uniform1f(u.u_sharp, patternSharpness);
    gl.uniform1f(u.u_wave, waveAmplitude);
    gl.uniform1f(u.u_noise, noiseScale);
    gl.uniform1f(u.u_chroma, chromaticSpread);
    gl.uniform1f(u.u_distort, distortion);
    gl.uniform1f(u.u_contour, contour);

    const light = hexToRgb(lightColor);
    const dark = hexToRgb(darkColor);
    const tint = hexToRgb(tintColor);
    gl.uniform3f(u.u_lightColor, light[0], light[1], light[2]);
    gl.uniform3f(u.u_darkColor, dark[0], dark[1], dark[2]);
    gl.uniform3f(u.u_tint, tint[0], tint[1], tint[2]);

    renderRef.current?.();
  }, [
    angle,
    blur,
    brightness,
    chromaticSpread,
    contrast,
    contour,
    darkColor,
    distortion,
    fresnel,
    lightColor,
    liquid,
    mode,
    noiseScale,
    patternSharpness,
    refraction,
    scale,
    seed,
    tintColor,
    waveAmplitude,
  ]);

  // Загрузка картинки, построение карты высот, загрузка текстуры и цикл отрисовки.
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl || mode !== "webgl") return;

    let disposed = false;
    let raf = 0;
    let texture: WebGLTexture | null = null;
    let textureReady = false;
    let animationTime = 0;
    let lastFrame = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inViewport = true;
    let documentVisible = !document.hidden;

    const u = uniformsRef.current;

    const image = new Image();
    image.crossOrigin = "anonymous";

    /** Рисуем один кадр. Без аргумента — тем же временем, что и в прошлый раз. */
    function renderFrame(time?: number) {
      if (time !== undefined) {
        const delta = lastFrame === 0 ? 16 : time - lastFrame;
        lastFrame = time;
        animationTime += delta * speedRef.current;
      }
      gl!.uniform1f(u.u_time, animationTime);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    function loop(time: number) {
      renderFrame(time);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf !== 0 || !textureReady) return;
      if (reduceMotion.matches) {
        // При reduced-motion — статичный кадр: декор остаётся, движения нет.
        renderFrame();
        return;
      }
      lastFrame = 0;
      raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function sync() {
      if (inViewport && documentVisible) start();
      else stop();
    }

    function resizeCanvas() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round((rect.width || 1) * dpr));
      const height = Math.max(1, Math.round((rect.height || 1) * dpr));
      if (canvas!.width === width && canvas!.height === height) return;
      canvas!.width = width;
      canvas!.height = height;
      gl!.viewport(0, 0, width, height);
      gl!.uniform1f(u.u_ratio, width / height);
    }

    image.onload = () => {
      if (disposed) return;

      if (image.naturalWidth && image.naturalHeight) {
        setAspect(image.naturalWidth / image.naturalHeight);
      }

      const heightMap = buildHeightMap(image, maxSize);
      if (!heightMap) {
        setMode("image");
        return;
      }

      gl.uniform1f(u.u_imgRatio, heightMap.width / heightMap.height);

      if (texture) gl.deleteTexture(texture);
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        heightMap.width,
        heightMap.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        heightMap.data,
      );
      gl.uniform1i(u.u_tex, 0);

      textureReady = true;
      renderFrame(0);
      sync();
    };

    image.onerror = () => {
      if (!disposed) setMode("image");
    };

    // src задаём последним: кэшированная картинка может отдать load-событие
    // раньше, чем мы успеем повесить обработчики.
    image.src = imageSrc;

    image.src = imageSrc;

    // Размер канваса зависит от вёрстки — следим за ней, а не только за window.
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      renderFrame();
      sync();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver((entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    intersectionObserver.observe(canvas);

    function handleVisibilityChange() {
      documentVisible = !document.hidden;
      sync();
    }

    // Пиксельная плотность может поменяться при переносе окна на другой монитор.
    function handleReduceMotionChange() {
      stop();
      sync();
    }

    resizeCanvas();
    renderRef.current = () => {
      if (textureReady) renderFrame();
    };
    sync();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    reduceMotion.addEventListener("change", handleReduceMotionChange);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      disposed = true;
      stop();
      renderRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reduceMotion.removeEventListener("change", handleReduceMotionChange);
      window.removeEventListener("resize", resizeCanvas);
      if (texture) gl.deleteTexture(texture);
    };
  }, [imageSrc, maxSize, mode]);

  const wrapperClass = className ?? "";
  const ratio = aspect ?? initialAspect;
  const wrapperStyle = ratio ? { aspectRatio: ratio } : undefined;

  if (mode === "image") {
    return (
      <div role="img" aria-label={label} className={wrapperClass} style={wrapperStyle}>
        {/*
          Обычный <img>, а не next/image: это аварийный вариант, когда WebGL
          недоступен, и он не должен зависеть от настроек загрузчика картинок.
        */}
        <img
          src={imageSrc}
          alt=""
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div role="img" aria-label={label} className={wrapperClass} style={wrapperStyle}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
