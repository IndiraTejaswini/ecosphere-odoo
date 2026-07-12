import React, { useRef, useState, useCallback, useEffect } from 'react';

const FALLOFF_CURVES = {
  linear: p => p,
  smooth: p => p * p * (3 - 2 * p),
  sharp: p => p * p * p
};

const DEFAULT_ITEMS = ['Overview', 'Environmental', 'Social', 'Governance', 'Gamification', 'Reports', 'Settings'];

export default function LineSidebar({
  items = DEFAULT_ITEMS,
  accentColor = '#163fa1',
  textColor = '#64748B',
  markerColor = '#CBD5E1',
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 20, // Clean, controlled offset depth
  falloff = 'smooth',
  markerLength = 40, // Perfect sizing matching standard sidebars
  markerGap = 16,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 24, // Consistent spacing matching dashboard layouts
  fontSize = 1.05,
  smoothing = 100,
  defaultActive = 0,
  onItemClick,
  className = ''
}) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const targetsRef = useRef([]);
  const currentRef = useRef([]);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  
  const [activeIndex, setActiveIndex] = useState(defaultActive);
  const activeRef = useRef(defaultActive);
  const smoothingRef = useRef(smoothing);

  useEffect(() => {
    setActiveIndex(defaultActive);
    activeRef.current = defaultActive;
  }, [defaultActive]);

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
    const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
    const itemsList = itemRefs.current;
    
    for (let i = 0; i < itemsList.length; i++) {
      const el = itemsList[i];
      if (!el) continue;
      
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(e.clientY - center);
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
    activeRef.current = index;
    startLoop();
    onItemClick?.(index, label);
  }, [onItemClick, startLoop]);

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <nav
      className={`relative w-full ${className}`}
      style={{
        '--accent-color': accentColor,
        '--text-color': textColor,
        '--marker-color': markerColor,
        '--marker-length': `${markerLength}px`,
        '--marker-gap': `${markerGap}px`,
        '--tick-scale': tickScale,
        '--max-shift': `${maxShift}px`,
        '--item-gap': `${itemGap}px`,
        '--font-size': `${fontSize}rem`,
        '--smoothing': `${smoothing}ms`
      }}
    >
      <ul
        ref={listRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="m-0 flex list-none flex-col py-2 w-full"
        style={{ gap: 'var(--item-gap)' }}
      >
        {items.map((label, index) => (
          <li
            key={`${label}-${index}`}
            ref={el => { itemRefs.current[index] = el; }}
            aria-current={activeIndex === index ? 'true' : undefined}
            onClick={() => handleClick(index, label)}
            className="relative cursor-pointer py-1 flex items-center select-none"
          >
            {/* Absolute container area holding markers + intermediate tick elements */}
            {showMarker && (
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
                style={{ width: 'var(--marker-length)' }}
              >
                {/* Main Dynamic Track Indicator Line */}
                <span
                  className="h-px origin-left transition-transform duration-75 block rounded-full"
                  style={{
                    width: 'var(--marker-length)',
                    backgroundColor: `color-mix(in srgb, var(--accent-color) calc(var(--effect, 0) * 100%), var(--marker-color))`,
                    transform: 'scaleX(calc(0.7 + var(--effect, 0) * 0.5))'
                  }}
                />

                {/* Sub-Tick Spacer Line Between Rows */}
                {index < items.length - 1 && (
                  <span
                    className="absolute h-px opacity-30 origin-left block rounded-full"
                    style={{
                      backgroundColor: 'var(--marker-color)',
                      width: 'calc(var(--marker-length) * var(--tick-scale))',
                      top: 'calc((var(--item-gap) / 2) + 4px)',
                      transform: scaleTick 
                        ? 'scaleX(calc(0.7 + var(--effect, 0) * 0.6))' 
                        : 'none'
                    }}
                  />
                )}
              </div>
            )}

            {/* Typography Content Group */}
            <span 
              className="relative inline-flex items-baseline leading-none font-bold tracking-tight transition-transform duration-75 select-none"
              style={{
                paddingLeft: showMarker ? 'calc(var(--marker-length) + var(--marker-gap))' : '0px',
                color: `color-mix(in srgb, var(--accent-color) calc(var(--effect, 0) * 100%), var(--text-color))`,
                transform: 'translateX(calc(var(--effect, 0) * var(--max-shift)))',
                fontSize: 'var(--font-size)'
              }}
            >
              {showIndex && (
                <span 
                  className="mr-3 font-mono text-[0.8em] tracking-normal transition-opacity duration-75"
                  style={{ opacity: 'calc(0.4 + var(--effect, 0) * 0.6)' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              <span>{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}