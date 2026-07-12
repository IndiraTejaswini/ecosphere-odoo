import { useRef, useEffect, useState } from "react";
import heroBg from '../../src/assets/hero.png';
import SplitText from './SplitText';

// --- BACKEND CONNECTION ---
import api from '../../api';

/**
 * NOTE ON WHAT CHANGED HERE:
 * - Removed the "Sign up" tab, the Role selector, and the Google/GitHub
 *   buttons. None of these have a real backend behind them:
 *     - There is no public self-registration endpoint - employees are
 *       created by an Admin (POST /api/employees, admin-only) or the seed
 *       script, never by a visitor filling out a form.
 *     - Letting a public form pick "Admin" as its own role would be a
 *       serious security hole even if a signup endpoint did exist.
 *     - Google/GitHub had no OAuth client wired up anywhere - clicking them
 *       would do nothing.
 *   If you want a real "request access" flow later, that's a different
 *   feature (e.g. a form that emails/notifies an Admin to create the
 *   account) - not a self-service signup form.
 * - Login now goes through api.auth.login() instead of a raw fetch with a
 *   hardcoded URL and a different localStorage key - this was the critical
 *   fix, since the mismatched key would've silently broken every other
 *   page's API calls even though login itself appeared to succeed.
 */
export default function HeroSection({ onAuthSuccess }) {
  const heroRef = useRef(null);
  const coverRef = useRef(null);
  const target = useRef({ x: 0, y: 0, active: false });
  const current = useRef({ x: 0, y: 0, radius: 0 });
  const tRef = useRef(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // --- BACKEND CONNECTION: real login ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.login(email, password); // stores the token under the correct key automatically
      onAuthSuccess?.();
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      ref={heroRef}
      id="home"
      onMouseMove={(e) => setFromClient(e.clientX, e.clientY)}
      onMouseLeave={() => { target.current.active = false; }}
      onTouchMove={(e) => e.touches[0] && setFromClient(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={() => { target.current.active = false; }}
      className="relative w-full h-screen min-h-[640px] overflow-hidden bg-sky-50"
    >
      <img
        src={heroBg}
        alt="Smarter ESG Management for Modern Enterprises"
        className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={coverRef}
          className="absolute -inset-5"
          style={{ backgroundImage: "linear-gradient(180deg, #cfe8fb 0%, #e8f3fb 38%, #fbfdff 70%, #ffffff 100%)", filter: "blur(7px)" }}
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 h-full flex items-center justify-between gap-10 px-[6vw] max-w-[1440px] mx-auto flex-wrap">
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

          <div className="mt-9 text-xs tracking-wide text-[#5b7185] opacity-75">
            move your cursor to look behind the curtain
          </div>
        </div>

        {/* Login card - Sign up / Role selector / OAuth removed, see note above */}
        <div className="flex-none w-full min-w-[300px] max-w-[380px] bg-white/70 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-[0_24px_60px_rgba(15,36,56,0.18)] px-[26px] pt-7 pb-8">
          <div className="mb-5">
            <h3 className="text-[#0f2438] text-base font-bold">Log in to EcoSphere</h3>
            <p className="text-xs text-[#5b7185] mt-1">Accounts are provisioned by your organization's Admin.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3c5468] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-[9px] border border-[#0f2438]/15 text-sm text-[#0f2438] bg-white outline-none focus:border-[#2f7fd4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3c5468] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[9px] border border-[#0f2438]/15 text-sm text-[#0f2438] bg-white outline-none focus:border-[#2f7fd4]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 rounded-[9px] bg-[#0f2438] text-white text-sm font-semibold hover:bg-[#16344f] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}