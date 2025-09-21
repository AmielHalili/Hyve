import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

// Lightweight SplitText alternative for chars/words without extra deps.
const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (document.fonts?.status === 'loaded') setFontsLoaded(true);
    else document.fonts?.ready.then(() => setFontsLoaded(true));
  }, []);

  const parts = useMemo(() => {
    if (splitType.includes('chars')) {
      return Array.from(text);
    }
    if (splitType.includes('words')) {
      // Preserve spaces as separate parts
      const re = /(\s+)/g;
      const tokens: string[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text))) {
        if (match.index > lastIndex) tokens.push(text.slice(lastIndex, match.index));
        tokens.push(match[0]);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) tokens.push(text.slice(lastIndex));
      return tokens;
    }
    // Fallback: no split
    return [text];
  }, [text, splitType]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fontsLoaded) return;

    // Clear previous triggers/tweens targeting this element
    ScrollTrigger.getAll().forEach((st) => {
      if (st.trigger === el) st.kill();
    });
    gsap.killTweensOf(el.querySelectorAll('[data-split]'));

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign =
      marginValue === 0
        ? ''
        : marginValue < 0
        ? `-=${Math.abs(marginValue)}${marginUnit}`
        : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    const targets = Array.from(el.querySelectorAll('[data-split]'));
    if (targets.length === 0) return;

    const tween = gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => onLetterAnimationComplete?.(),
      }
    );

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [delay, duration, ease, from, to, rootMargin, threshold, fontsLoaded, parts, onLetterAnimationComplete]);

  const Tag = tag as any;
  const style: React.CSSProperties = {
    textAlign,
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
  };

  return (
    <Tag ref={ref} style={style} className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}>
      {parts.map((p, i) => {
        // Preserve whitespace tokens when splitting words
        if (splitType.includes('words') && /^\s+$/.test(p)) return <span key={`ws-${i}`} aria-hidden>{p}</span>;
        return (
          <span
            key={i}
            data-split
            className={splitType.includes('chars') ? 'split-char inline-block' : 'split-word inline-block'}
            style={{ display: 'inline-block' }}
          >
            {p}
          </span>
        );
      })}
    </Tag>
  );
};

export default SplitText;

