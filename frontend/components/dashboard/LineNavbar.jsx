import React, { useRef, useState, useCallback, useEffect } from 'react';

const FALLOFF_CURVES = {
  linear: p => p,
  smooth: p => p * p * (3 - 2 * p),
  sharp: p => p * p * p
};

export default function LineNavbar({
  items,
  accentColor = '#d946ef',
  textColor = '#94A3B8',
  proximityRadius = 100,
  maxShift = 6,
  falloff = 'smooth',
  itemGap = 24,
  fontSize = 0.85,
  smoothing = 100,
  defaultActive = 0,
  onItemClick
}) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const targetsRef = useRef([]);
  const currentRef = useRef([]);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const activeRef = useRef(defaultActive);
  const smoothingRef = useRef(smoothing);
  const [activeIndex, setActiveIndex] = useState(defaultActive);

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  const runFrame = useCallback(now => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const itemsList = itemRefs.current;
    for (let i = 0; i < itemsList.length; i++) {
      const el = itemsList[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty('--effect', value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(e => {
    const list = listRef.current;
    if (!list) return;
    const rect = list.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
    const itemsList = itemRefs.current;
    for (let i = 0; i < itemsList.length; i++) {
      const el = itemsList[i];
      if (!el) continue;
      const center = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(pointerX - center);
      targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
    }
    startLoop();
  }, [falloff, proximityRadius, startLoop]);

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback((index, label) => {
    setActiveIndex(index);
    onItemClick?.(index, label);
  }, [onItemClick]);

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <nav className="relative flex justify-start items-center">
      <ul
        ref={listRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="m-0 flex list-none flex-row items-center py-2 px-4 rounded-xl bg-white border border-slate-200/60 select-none shadow-3xs"
        style={{ gap: `${itemGap}px` }}
      >
        {items.map((label, index) => (
          <li
            key={`${label}-${index}`}
            ref={el => { itemRefs.current[index] = el; }}
            onClick={() => handleClick(index, label)}
            className="relative cursor-pointer py-1.5 px-3 flex items-center justify-center group rounded-lg"
            style={{
              '--accent-color': accentColor,
              '--text-color': textColor,
              '--max-shift': `${maxShift}px`,
              '--font-size': `${fontSize}rem`
            }}
          >
            <span 
              className="absolute inset-0 rounded-lg bg-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10"
              style={{
                transform: 'scale(calc(0.95 + var(--effect, 0) * 0.05))',
              }}
            />
            <span 
              className="relative inline-flex items-center font-bold tracking-wide transition-all duration-75 leading-none"
              style={{
                color: `color-mix(in_srgb, ${accentColor} calc(var(--effect, 0) * 100%), ${textColor})`,
                transform: 'translateX(calc(var(--effect, 0) * var(--max-shift)))',
                fontSize: 'var(--font-size)'
              }}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}