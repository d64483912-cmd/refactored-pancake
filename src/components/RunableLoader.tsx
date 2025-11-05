import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

type Props = {
  logoCount?: number;
};

// Note: Background blobs removed per request — clean backdrop

// Unified playfield: one bun + tiny React logos with organic motion
export default function RunableLoader({ logoCount = 12 }: Props) {
  // Safe zone around hero text (percent coordinates)
  const safe = { x1: 34, x2: 66, y1: 28, y2: 62, cx: 50, cy: 45 };

  // Bun physics state in a ref for reliable per-frame updates
  const bunRef = useRef<{ x: number; y: number; angle: number }>({
    x: (() => {
      let x = 15 + Math.random() * 70;
      let y = 18 + Math.random() * 64;
      if (x > safe.x1 && x < safe.x2 && y > safe.y1 && y < safe.y2) {
        x = x < 50 ? 22 : 78;
      }
      return x;
    })(),
    y: (() => {
      let x = 15 + Math.random() * 70;
      let y = 18 + Math.random() * 64;
      if (x > safe.x1 && x < safe.x2 && y > safe.y1 && y < safe.y2) {
        y = y < 45 ? 24 : 76;
      }
      return y;
    })(),
    angle: 0,
  });

  const bunVel = useRef({
    vx: (Math.random() * 8 + 6) * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 8 + 6) * (Math.random() < 0.5 ? -1 : 1),
    w: (Math.random() * 20 + 10) * (Math.random() < 0.5 ? -1 : 1),
  });

  // Logos stored in a ref array
  const logos = useRef(
    Array.from({ length: logoCount }).map(() => {
      // Spawn near edges to keep center clear
      let x = Math.random() < 0.5 ? 8 + Math.random() * 16 : 76 + Math.random() * 16;
      let y = 12 + Math.random() * 76;
      if (Math.random() < 0.5) {
        y = Math.random() < 0.5 ? 10 + Math.random() * 14 : 72 + Math.random() * 16;
        x = 12 + Math.random() * 76;
      }
      return {
        x,
        y,
        vx: (Math.random() * 10 + 6) * (Math.random() < 0.5 ? -1 : 1),
        vy: (Math.random() * 10 + 6) * (Math.random() < 0.5 ? -1 : 1),
        angle: Math.random() * 360,
        spin: (Math.random() * 30 + 10) * (Math.random() < 0.5 ? -1 : 1),
      };
    })
  );

  // Tick triggers re-renders for ref-driven physics
  const [, setTick] = useState(0);
  const raf = useRef<number | null>(null);
  const t = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t.current += dt;

      // Bun steering
      {
        const b = bunRef.current;
        const n1 = Math.sin(t.current * 0.9) + Math.sin(t.current * 1.7 + 1.2) * 0.5;
        const n2 = Math.cos(t.current * 0.8 + 0.8) + Math.sin(t.current * 1.3 + 2.1) * 0.6;
        let ax = n1 * 6;
        let ay = n2 * 6;

        const margin = 6;
        if (b.x < margin) ax += (margin - b.x) * 3;
        if (b.x > 100 - margin) ax -= (b.x - (100 - margin)) * 3;
        if (b.y < margin) ay += (margin - b.y) * 3;
        if (b.y > 100 - margin) ay -= (b.y - (100 - margin)) * 3;

        if (b.x > safe.x1 && b.x < safe.x2 && b.y > safe.y1 && b.y < safe.y2) {
          const dx = b.x - safe.cx;
          const dy = b.y - safe.cy;
          const dist = Math.max(6, Math.hypot(dx, dy));
          ax += (dx / dist) * 40;
          ay += (dy / dist) * 40;
        }

        bunVel.current.vx = (bunVel.current.vx + ax * dt) * 0.985;
        bunVel.current.vy = (bunVel.current.vy + ay * dt) * 0.985;
        const max = 18;
        const sp = Math.hypot(bunVel.current.vx, bunVel.current.vy);
        if (sp > max) {
          bunVel.current.vx = (bunVel.current.vx / sp) * max;
          bunVel.current.vy = (bunVel.current.vy / sp) * max;
        }
        b.x = Math.max(2, Math.min(98, b.x + bunVel.current.vx * dt));
        b.y = Math.max(2, Math.min(98, b.y + bunVel.current.vy * dt));

        const wobble = Math.sin(t.current * 0.7) * 10 + Math.cos(t.current * 1.1) * 6;
        bunVel.current.w = bunVel.current.w * 0.98 + wobble * 0.02;
        b.angle = b.angle + bunVel.current.w * dt;
      }

      // Logos swarm (separation + mild noise + bun avoidance)
      {
        const L = logos.current;
        const b = bunRef.current;
        for (let i = 0; i < L.length; i++) {
          const a = L[i];
          let ax = Math.sin((t.current + i) * 0.9) * 4;
          let ay = Math.cos(t.current * 1.1 + i * 0.3) * 4;

          // separation
          for (let j = 0; j < L.length; j++) {
            if (i === j) continue;
            const c = L[j];
            const dx = a.x - c.x;
            const dy = a.y - c.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 100) {
              const d = Math.max(4, Math.sqrt(d2));
              ax += (dx / d) * 20;
              ay += (dy / d) * 20;
            }
          }

          // avoid bun
          {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = Math.max(6, Math.hypot(dx, dy));
            if (d < 18) {
              ax += (dx / d) * 50;
              ay += (dy / d) * 50;
            }
          }

          // avoid hero text zone
          if (a.x > safe.x1 && a.x < safe.x2 && a.y > safe.y1 && a.y < safe.y2) {
            const dx = a.x - safe.cx;
            const dy = a.y - safe.cy;
            const d = Math.max(6, Math.hypot(dx, dy));
            ax += (dx / d) * 40;
            ay += (dy / d) * 40;
          }

          // edges
          const margin = 4;
          if (a.x < margin) ax += (margin - a.x) * 3;
          if (a.x > 100 - margin) ax -= (a.x - (100 - margin)) * 3;
          if (a.y < margin) ay += (margin - a.y) * 3;
          if (a.y > 100 - margin) ay -= (a.y - (100 - margin)) * 3;

          a.vx = (a.vx + ax * dt) * 0.985;
          a.vy = (a.vy + ay * dt) * 0.985;
          const max = 22;
          const sp = Math.hypot(a.vx, a.vy);
          if (sp > max) {
            a.vx = (a.vx / sp) * max;
            a.vy = (a.vy / sp) * max;
          }
          a.x = Math.max(2, Math.min(98, a.x + a.vx * dt));
          a.y = Math.max(2, Math.min(98, a.y + a.vy * dt));
          a.spin = a.spin * 0.99 + Math.sin(t.current * 0.6 + i) * 0.08;
          a.angle = a.angle + a.spin * dt;
        }
      }

      // Re-render ~30fps to show ref changes
      setTick((v) => (v + 1) % 2);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const bun = bunRef.current;

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* Bun */}
      <div className="absolute" style={{ left: `${bun.x}%`, top: `${bun.y}%` }}>
        <motion.div
          aria-hidden
          className="absolute -inset-2 -z-10 m-auto h-14 w-14 rounded-full bg-primary/20 blur-2xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <img src="/bun.svg" alt="Bun mascot" className="h-12 w-12 drop-shadow-sm" style={{ transform: `rotate(${bun.angle}deg)` }} />
      </div>

      {/* React logos swarm */}
      {logos.current.map((p, i) => (
        <div key={i} className="absolute opacity-90" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <img src="/react.svg" alt="React" className="h-5 w-5" style={{ transform: `rotate(${p.angle}deg)` }} />
        </div>
      ))}
    </div>
  );
}
