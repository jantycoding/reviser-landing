import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { group, power3Out, power3InOut, power4Out, tween } from '../../lib/tween';
import './MaskedHeading.css';

/**
 * MaskedHeading (react-bits, вариант JS + CSS), 26.08.2026 по запросу владельца.
 *
 * ЧТО ДЕЛАЕТ. Буквы заголовка работают маской: сквозь них видно картинку,
 * которая едет за курсором и сама по себе слегка дрейфует.
 *
 * ТРИ ПРАВКИ ОТНОСИТЕЛЬНО ИСХОДНИКА ИЗ БИБЛИОТЕКИ
 *
 * 0. Библиотека анимаций заменена своим твинером (lib/tween.js). Здесь от неё
 *    требовалось поднять слова снизу вверх и погасить либо раскрыть слой —
 *    это два числа по кривой. Отдельный пакет ради такого весил бы больше
 *    всей страницы с картинками, а его установка на машине владельца сорвала
 *    сборку целиком. Кривые взяты формулами один в один.
 *
 * 1. `inheritFont`. Оригинал каждый кадр пересчитывает размер шрифта как долю
 *    ширины контейнера (`textScale`) и пишет его прямо в style. У нас кегль
 *    задан через clamp() в дизайн-системе и растёт по своей кривой, поэтому
 *    компонент сломал бы первый экран: заголовок начал бы жить отдельно от
 *    остальной страницы. С `inheritFont` размер, начертание, трекинг и
 *    интерлиньяж берутся из CSS — ровно те, что были до анимации. Владелец
 *    просил «шрифт и размер как сейчас», это оно и есть.
 *
 * 2. Пустой `src` больше не рендерит битую картинку. Если файла нет, компонент
 *    показывает обычный текст: маска — украшение, а не условие читаемости.
 *
 * ЧЕГО ЗДЕСЬ НЕТ И ПОЧЕМУ. В маску нельзя подставить живой Silk с первого
 * экрана: маска умеет показывать <img>/<video>, а Silk — это WebGL-холст.
 * Второй холст на первом экране стоил бы дороже всей анимации. Поэтому внутри
 * букв — тёмная тканевая текстура (та же, что на превью для мессенджеров).
 * Белый шёлк со страницы туда класть нельзя вдвойне: белым по белому буквы
 * просто исчезли бы.
 */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const MaskedHeading = ({
  text = 'Designed in the details',
  tag = 'h2',
  mediaType = 'image',
  src = '',
  poster = '',
  fillScale = 1.25,
  parallax = 26,
  drift = 18,
  brightness = 1,
  saturation = 1,
  grayscale = false,
  reveal = 'rise',
  duration = 1.1,
  stagger = 0.09,
  trigger = 'view',
  align = 'center',
  weight = 700,
  tracking = -0.03,
  lineHeight = 1.06,
  textScale = 0.115,
  inheritFont = false,
  className = '',
  style,
  ...rest
}) => {
  const rootRef = useRef(null);
  const measureRef = useRef(null);
  const revealRef = useRef(null);
  const mediaRef = useRef(null);
  const wordRefs = useRef([]);
  const baseRefs = useRef([]);
  const glyphRefs = useRef([]);
  const tweenRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const words = useMemo(() => String(text).split(/\s+/).filter(Boolean), [text]);

  const settingsRef = useRef({});
  settingsRef.current = { fillScale, parallax, drift, brightness, saturation, grayscale, textScale, inheritFont };

  const place = useCallback(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const s = settingsRef.current;
    const W = root.clientWidth;
    const H = root.clientHeight;
    const off = offsetRef.current;
    const maxX = Math.max(0, ((s.fillScale - 1) / 2) * W);
    const maxY = Math.max(0, ((s.fillScale - 1) / 2) * H);
    media.style.transform = `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${s.fillScale})`;
    media.style.filter = `brightness(${s.brightness}) saturate(${s.saturation})${s.grayscale ? ' grayscale(1)' : ''}`;
  }, []);

  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    const s = settingsRef.current;

    /* Единственное отличие от исходника: при inheritFont размер не трогаем.
       Дальше вся геометрия маски всё равно снимается с реального текста
       через getComputedStyle, поэтому clamp() из дизайн-системы работает
       так же, как работал бы вписанный сюда пиксельный кегль. */
    if (!s.inheritFont) {
      root.style.fontSize = `${clamp(root.clientWidth * s.textScale, 20, 200).toFixed(1)}px`;
    }

    const cs = window.getComputedStyle(measure);
    for (let i = 0; i < wordRefs.current.length; i += 1) {
      const box = wordRefs.current[i];
      const base = baseRefs.current[i];
      const glyph = glyphRefs.current[i];
      if (!box || !base || !glyph) continue;
      glyph.setAttribute('x', `${box.offsetLeft}`);
      glyph.setAttribute('y', `${base.offsetTop}`);
      glyph.style.fontFamily = cs.fontFamily;
      glyph.style.fontSize = cs.fontSize;
      glyph.style.fontWeight = cs.fontWeight;
      glyph.style.fontStyle = cs.fontStyle;
      glyph.style.letterSpacing = cs.letterSpacing;
    }
    place();
  }, [place]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(root);
    if (document.fonts?.ready) document.fonts.ready.then(sync).catch(() => {});

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const s = settingsRef.current;
      const off = offsetRef.current;
      const dx = Math.sin(clock * 0.21) * s.drift;
      const dy = Math.cos(clock * 0.17) * s.drift * 0.6;
      const ease = 1 - Math.exp(-dt / 0.18);
      off.x += (off.tx + dx - off.x) * ease;
      off.y += (off.ty + dy - off.y) * ease;
      place();
      raf = requestAnimationFrame(frame);
    };

    const onMove = e => {
      const s = settingsRef.current;
      if (s.parallax <= 0) return;
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
      const ny = ((e.clientY - r.top) / (r.height || 1)) * 2 - 1;
      offsetRef.current.tx = clamp(nx, -1, 1) * -s.parallax;
      offsetRef.current.ty = clamp(ny, -1, 1) * -s.parallax;
    };
    const onLeave = () => {
      offsetRef.current.tx = 0;
      offsetRef.current.ty = 0;
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [place, sync]);

  useEffect(() => {
    sync();
  }, [sync, words, tag, align, weight, tracking, lineHeight, textScale]);

  useEffect(() => {
    const root = rootRef.current;
    const layer = revealRef.current;
    if (!root || !layer) return;
    const glyphs = glyphRefs.current.filter(Boolean);
    if (!glyphs.length) return;

    const riseDistance = () => (parseFloat(window.getComputedStyle(root).fontSize) || 48) * 1.15;

    /* «Поставить значение сейчас» — обычная запись в стиль элемента. */
    const setY = (el, y) => {
      el.style.transform = y ? `translate(0px, ${y}px)` : '';
    };
    const setLayer = (opacity, scale, clip) => {
      layer.style.opacity = String(opacity);
      layer.style.transform = scale === 1 ? '' : `scale(${scale})`;
      layer.style.clipPath = clip;
    };

    const settle = () => {
      glyphs.forEach(g => setY(g, 0));
      setLayer(1, 1, 'inset(0% 0% 0% 0%)');
    };

    const rest = () => {
      if (reveal === 'rise') {
        const d = riseDistance();
        glyphs.forEach(g => setY(g, d));
      } else if (reveal === 'wipe') {
        layer.style.clipPath = 'inset(0% 100% 0% 0%)';
      } else if (reveal === 'fade') {
        setLayer(0, 1.08, 'inset(0% 0% 0% 0%)');
      }
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reveal === 'none' || reduce) {
      settle();
      return;
    }

    const play = () => {
      tweenRef.current?.kill();
      const bundle = group();
      tweenRef.current = bundle;

      if (reveal === 'rise') {
        setLayer(1, 1, 'inset(0% 0% 0% 0%)');
        const d = riseDistance();
        /* Ступенчатость — не отдельная возможность библиотеки, а сдвиг
           старта: каждое следующее слово выезжает на `stagger` секунд позже. */
        glyphs.forEach((glyph, i) => {
          setY(glyph, d);
          bundle.add(
            tween({
              from: d,
              to: 0,
              duration,
              delay: i * stagger,
              ease: power4Out,
              onUpdate: v => setY(glyph, v),
            }),
          );
        });
      } else if (reveal === 'wipe') {
        glyphs.forEach(glyph => setY(glyph, 0));
        bundle.add(
          tween({
            from: 100,
            to: 0,
            duration,
            ease: power3InOut,
            onUpdate: v => {
              layer.style.clipPath = `inset(0% ${v}% 0% 0%)`;
            },
          }),
        );
      } else {
        glyphs.forEach(glyph => setY(glyph, 0));
        bundle.add(
          tween({
            from: 0,
            to: 1,
            duration,
            ease: power3Out,
            onUpdate: v => setLayer(v, 1.08 - 0.08 * v, 'inset(0% 0% 0% 0%)'),
          }),
        );
      }
    };

    if (trigger === 'hover') {
      settle();
      root.addEventListener('pointerenter', play);
      return () => {
        root.removeEventListener('pointerenter', play);
        tweenRef.current?.kill();
      };
    }

    if (trigger === 'view') {
      settle();
      rest();
      const io = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            play();
            io.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(root);
      return () => {
        io.disconnect();
        tweenRef.current?.kill();
      };
    }

    play();
    return () => tweenRef.current?.kill();
  }, [reveal, trigger, duration, stagger, words]);

  const Tag = tag;

  /* Нет картинки — нет и маски: рисуем обычный текст. Иначе получилась бы
     худшая из возможных поломок, когда заголовок первого экрана исчезает
     целиком из-за не загрузившегося декоративного файла (текст под маской
     прозрачный по определению). */
  if (!src) {
    return (
      <Tag className={className} style={style} {...rest}>
        {text}
      </Tag>
    );
  }

  /* При inheritFont инлайновые начертание/трекинг/интерлиньяж не навязываем:
     иначе они перебили бы классы дизайн-системы, ради которых всё и затевалось. */
  const rootStyle = inheritFont
    ? { textAlign: align, ...style }
    : { textAlign: align, fontWeight: weight, letterSpacing: `${tracking}em`, lineHeight, ...style };

  return (
    <Tag ref={rootRef} className={`masked-heading ${className}`.trim()} style={rootStyle} {...rest}>
      <span ref={measureRef} className="masked-heading__measure">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            ref={el => {
              wordRefs.current[i] = el;
            }}
            className="masked-heading__word"
          >
            {word}
            <i
              ref={el => {
                baseRefs.current[i] = el;
              }}
              className="masked-heading__baseline"
            />
          </span>
        ))}
      </span>

      <svg className="masked-heading__defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {words.map((word, i) => (
              <text
                key={`${word}-${i}`}
                ref={el => {
                  glyphRefs.current[i] = el;
                }}
              >
                {word}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      <span ref={revealRef} className="masked-heading__reveal">
        <span className="masked-heading__clip" style={{ clipPath: `url(#${clipId})` }}>
          <span ref={mediaRef} className="masked-heading__media">
            {mediaType === 'video' ? (
              <video className="masked-heading__source" src={src} poster={poster} autoPlay muted loop playsInline />
            ) : (
              <img className="masked-heading__source" src={src} alt="" draggable={false} />
            )}
          </span>
        </span>
      </span>
    </Tag>
  );
};

export default MaskedHeading;
