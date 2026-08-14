import { useEffect, useRef } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';
import './Silk.css';

/**
 * Silk (react-bits) — шёлковые волны, фон первого экрана с 14.08.2026
 * (запрос владельца, настройки его же: speed 10, scale 0.8, #ffffff,
 * noiseIntensity 1.5, rotation 0).
 *
 * ── Почему это порт, а не оригинал ──────────────────────────────────
 * Вариант из реестра сидит на @react-three/fiber + three. Этого стека в
 * проекте нет, а тащить ~150 КБ обвязки ради одного фуллскрин-шейдера —
 * плохой размен. ШЕЙДЕР ВЗЯТ ИЗ РЕЕСТРА ДОСЛОВНО, поменялась только
 * обвязка: ogl (Renderer/Triangle/Program/Mesh) — та же, на которой в
 * проекте работают Aurora и Prism. Единственное отличие переноса:
 * vUv берётся с фуллскрин-треугольника ogl, а не с plane three.js —
 * на картинку это не влияет, uv покрывает экран так же.
 *
 * Тайминг оригинала сохранён: uTime += 0.1 * delta за кадр.
 *
 * ── Мобильные и reduced-motion ──────────────────────────────────────
 * Один статичный кадр, без rAF-цикла — тот же приём, что у Aurora:
 * основной трафик с телефонов, кадровый бюджет там принадлежит прокрутке.
 */
const VERT = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

const hexToRGB = hex => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
};

export default function Silk({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }) {
  const ctnDom = useRef(null);
  const propsRef = useRef({ speed, scale, color, noiseIntensity, rotation });
  propsRef.current = { speed, scale, color, noiseIntensity, rotation };

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr: Math.min(2, window.devicePixelRatio || 1) });
    const gl = renderer.gl;

    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
    });
    ctn.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToRGB(color) },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uRotation: { value: rotation },
        uNoiseIntensity: { value: noiseIntensity },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(ctn.offsetWidth || 1, ctn.offsetHeight || 1);
    };
    window.addEventListener('resize', resize);
    resize();

    const narrow = window.matchMedia?.('(max-width: 767px)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const staticFrame = narrow || reduced;

    let raf = 0;
    let last = performance.now();

    const draw = now => {
      // Тайминг оригинала: uTime += 0.1 * delta (секунды).
      const delta = (now - last) / 1000;
      last = now;
      const p = propsRef.current;
      program.uniforms.uTime.value += 0.1 * delta;
      program.uniforms.uSpeed.value = p.speed;
      program.uniforms.uScale.value = p.scale;
      program.uniforms.uRotation.value = p.rotation;
      program.uniforms.uNoiseIntensity.value = p.noiseIntensity;
      program.uniforms.uColor.value = hexToRGB(p.color);
      renderer.render({ scene: mesh });
    };

    if (staticFrame) {
      program.uniforms.uTime.value = 4;
      draw(performance.now());
    } else {
      const loop = now => {
        raf = requestAnimationFrame(loop);
        draw(now);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ctnDom} className="silk-container" />;
}
