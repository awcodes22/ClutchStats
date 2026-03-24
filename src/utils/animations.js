import { useState, useEffect } from "react";

// Flips to true after `delay` ms whenever `dependency` changes,
// triggering Chart.js's grow-in animation from zero → real values.
export function useChartReveal(dependency, delay = 350) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!dependency) return;
    setReady(false);
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [dependency, delay]);

  return ready;
}

// Returns true once the element scrolls into view, then disconnects.
// `resetOn` re-triggers the observer when it changes (e.g. new player).
export function useInView(ref, { threshold = 0.1, resetOn } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setInView(false);
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // resetOn is intentionally included so the hook re-observes when the
  // underlying data changes (e.g. navigating to a different player).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetOn, threshold]);

  return inView;
}

// Animates ref's textContent from 0 → target using cubic ease-out.
// Uses a DOM ref instead of state to avoid re-render overhead.
export function useCountUp(ref, target, { duration = 1600, delay = 0 } = {}) {
  useEffect(() => {
    const numTarget = Number(target);
    let rafId;

    const timeoutId = setTimeout(() => {
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (ref.current) ref.current.textContent = Math.round(eased * numTarget);
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [target, delay, duration]);
}
