import { useRef, useEffect, useState } from "react";

// Import the image from your assets folder
import heroBg from '../../src/assets/hero.png';

// Import your SplitText component (Adjust path if needed)
import SplitText from './SplitText';

/**
 * Hero section with an organic cursor-reveal effect.
 * A light-blue-to-white cover sits over the background photo; moving the
 * cursor cuts a soft, uneven blob-shaped hole in the cover (CSS clip-path,
 * evenodd rule), revealing the real image underneath. The blob keeps
 * wobbling gently even when the cursor is still, and shrinks away to
 * nothing when the cursor leaves.
 */
export default function HeroSection() {
  const heroRef = useRef(null);
  const coverRef = useRef(null);
  const target = useRef({ x: 0, y: 0, active: false });
  const current = useRef({ x: 0, y: 0, radius: 0 });
  const tRef = useRef(0);
  const [isSignup, setIsSignup] = useState(false);

  const blobPath = (cx, cy, baseR, t, points = 22) => {
    const step = (Math.PI * 2) / points;
    const coords = [];
    for (let i = 0; i < points; i++) {
      const angle = i * step;
      const noise =
        Math.sin(angle * 4 + t * 0.7) * 0.1 +
        Math.sin(angle * 7 - t * 1.1) * 0.07 +
        Math.sin(angle * 11 + t * 1.6) * 0.05;
      const r = baseR * (1 + noise);
      coords.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    let d = `M ${(coords[0][0] + coords[points - 1][0]) / 2} ${(coords[0][1] + coords[points - 1][1]) / 2} `;
    for (let i = 0; i < points; i++) {
      const cur = coords[i];
      const next = coords[(i + 1) % points];
      const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
      d += `Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)} `;
    }
    return d + "Z";
  };

  useEffect(() => {
    let raf;
    const loop = () => {
      const t = target.current;
      const c = current.current;
      const ease = 0.13;
      c.x += (t.x - c.x) * ease;
      c.y += (t.y - c.y) * ease;
      const targetRadius = t.active ? 110 : 0;
      c.radius += (targetRadius - c.radius) * 0.1;
      tRef.current += 0.025;

      const cover = coverRef.current;
      const hero = heroRef.current;
      if (cover && hero) {
        const w = hero.offsetWidth;
        const h = hero.offsetHeight;
        if (c.radius > 1) {
          const INSET = 20;
          const blob = blobPath(c.x + INSET, c.y + INSET, c.radius, tRef.current);
          const d = `M0 0 L ${w + INSET * 2} 0 L ${w + INSET * 2} ${h + INSET * 2} L 0 ${h + INSET * 2} Z ${blob}`;
          const clip = `path(evenodd, '${d}')`;
          cover.style.clipPath = clip;
          cover.style.webkitClipPath = clip;
        } else {
          cover.style.clipPath = "none";
          cover.style.webkitClipPath = "none";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setFromClient = (clientX, clientY) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    target.current.x = clientX - rect.left;
    target.current.y = clientY - rect.top;
    target.current.active = true;
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={(e) => setFromClient(e.clientX, e.clientY)}
      onMouseLeave={() => { target.current.active = false; }}
      onTouchMove={(e) => e.touches[0] && setFromClient(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={() => { target.current.active = false; }}
      className="relative w-full h-screen min-h-[640px] overflow-hidden bg-sky-50"
    >
      {/* Layer 1: real photo, always underneath. */}
      <img
        src={heroBg}
        alt="Smarter ESG Management for Modern Enterprises"
        className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
      />

      {/* Layer 2: cover — light blue at top fading to white — clipped by the blob to reveal the photo */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={coverRef}
          className="absolute -inset-5"
          style={{ backgroundImage: "linear-gradient(180deg, #cfe8fb 0%, #e8f3fb 38%, #fbfdff 70%, #ffffff 100%)", filter: "blur(7px)" }}
        />
      </div>

      {/* subtle grain so the reveal edge doesn't look too clean */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* content: two columns */}
      <div className="relative z-10 h-full flex items-center justify-between gap-10 px-[6vw] max-w-[1440px] mx-auto flex-wrap">

        {/* left: copy */}
        <div className="flex-1 min-w-[320px] text-left" style={{ flexBasis: 420 }}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#152a40]/[0.06] border border-[#152a40]/10 text-[#1c3a52] text-sm font-semibold tracking-wide mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f7fd4]" />
            Smarter ESG Management for Modern Enterprises
          </div>

          <SplitText
            tag="h1"
            text="Sustainability, built into every operation."
            className="m-0 font-serif font-semibold text-[clamp(36px,4.6vw,68px)] leading-[1.05] text-[#0f2438] max-w-[12ch] tracking-tight"
            textAlign="left"
            delay={30}
          />

          <p className="mt-5 max-w-[460px] text-[clamp(15px,1.3vw,18px)] leading-relaxed text-[#3c5468] font-normal">
            Monitor environmental impact, strengthen governance, engage employees, and generate real-time ESG insights through one unified enterprise platform.
          </p>

          <div className="flex gap-3.5 mt-8 flex-wrap">
            <button className="px-6.5 py-3.5 rounded-[10px] bg-[#0f2438] text-white text-[15px] font-semibold shadow-[0_8px_20px_rgba(15,36,56,0.25)] hover:bg-[#16344f] transition-colors">
              Start building free
            </button>
            
          </div>

          <div className="mt-9 text-xs tracking-wide text-[#5b7185] opacity-75">
            move your cursor to look behind the curtain
          </div>
        </div>

        {/* right: login / signup card */}
        <div className="flex-none w-full min-w-[300px] max-w-[380px] bg-white/70 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-[0_24px_60px_rgba(15,36,56,0.18)] px-[26px] pt-7 pb-8">
          <div className="flex bg-[#0f2438]/[0.06] rounded-[10px] p-1 mb-5">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-[7px] text-sm font-semibold transition-colors ${!isSignup ? "bg-white text-[#0f2438] shadow-sm" : "bg-transparent text-[#5b7185]"}`}
            >
              Log in
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-[7px] text-sm font-semibold transition-colors ${isSignup ? "bg-white text-[#0f2438] shadow-sm" : "bg-transparent text-[#5b7185]"}`}
            >
              Sign up
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-[#3c5468] mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  className="w-full px-3.5 py-2.5 rounded-[9px] border border-[#0f2438]/15 text-sm text-[#0f2438] bg-white outline-none focus:border-[#2f7fd4]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#3c5468] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-[9px] border border-[#0f2438]/15 text-sm text-[#0f2438] bg-white outline-none focus:border-[#2f7fd4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3c5468] mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[9px] border border-[#0f2438]/15 text-sm text-[#0f2438] bg-white outline-none focus:border-[#2f7fd4]"
              />
            </div>

            <button className="mt-1.5 w-full py-3 rounded-[9px] bg-[#0f2438] text-white text-sm font-semibold hover:bg-[#16344f] transition-colors">
              {isSignup ? "Create account" : "Log in"}
            </button>

            <div className="flex items-center gap-2.5 my-1 text-[#8296a8] text-xs">
              <div className="flex-1 h-px bg-[#0f2438]/10" />
              or continue with
              <div className="flex-1 h-px bg-[#0f2438]/10" />
            </div>

            <div className="flex gap-2.5">
              <button className="flex-1 py-2.5 rounded-[9px] border border-[#0f2438]/15 bg-white text-[#0f2438] text-[13.5px] font-semibold hover:bg-gray-50 transition-colors">
                Google
              </button>
              <button className="flex-1 py-2.5 rounded-[9px] border border-[#0f2438]/15 bg-white text-[#0f2438] text-[13.5px] font-semibold hover:bg-gray-50 transition-colors">
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}