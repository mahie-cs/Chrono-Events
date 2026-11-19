"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type PanInfo,
} from "framer-motion";
import { clamp, project, rubber, SPRING } from "@/lib/motion";

/**
 * Horizontal pager. One motion value `pos` (in page units, 0..n-1) drives the
 * pages AND the tab indicator, so both follow the finger 1:1.
 */
export function usePager(keys: readonly string[]) {
  const count = keys.length;
  const last = count - 1;
  const reduce = useReducedMotion();

  const pos = useMotionValue(0);
  const width = useMotionValue(1);
  const activeMV = useMotionValue(0);
  const [active, setActive] = useState(0); // page that sits in normal flow
  const [selected, setSelected] = useState(0); // tab that is highlighted

  const containerRef = useRef<HTMLDivElement>(null);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const moving = useRef(false);
  const activeRef = useRef(0);
  const ignore = useRef(false);
  const grabbed = useRef(false);
  const panned = useRef(false);
  const justPanned = useRef(false);
  const pan = useRef<{ decided: boolean; base: number; ox0: number; start: number } | null>(null);

  // keep the container width in a motion value
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const set = () => width.set(el.clientWidth || 1);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const settle = useCallback(
    (n: number) => {
      activeRef.current = n;
      activeMV.set(n);
      setActive(n);
      moving.current = false;
    },
    [activeMV],
  );

  const goTo = useCallback(
    (target: number, velocity = 0, bounce = 0, instant = false) => {
      const n = clamp(target, 0, last);
      anim.current?.stop();
      setSelected(n);
      if (typeof window !== "undefined") {
        if (window.scrollY > 0) window.scrollTo(0, 0);
        try {
          if (location.hash.slice(1) !== keys[n]) history.replaceState(null, "", "#" + keys[n]);
        } catch {
          /* hash updates are optional */
        }
      }
      if (instant || reduce) {
        pos.set(n);
        settle(n);
        return;
      }
      moving.current = true;
      anim.current = animate(pos, n, {
        ...SPRING(bounce),
        velocity,
        onComplete: () => settle(n),
      });
    },
    [keys, last, pos, reduce, settle],
  );

  // deep links (#events) and back/forward hash changes
  useEffect(() => {
    const fromHash = () => keys.indexOf(location.hash.slice(1));
    const first = fromHash();
    if (first > 0) goTo(first, 0, 0, true);
    const onHash = () => {
      const i = fromHash();
      if (i >= 0 && (i !== activeRef.current || moving.current)) goTo(i);
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      ignore.current = e.pointerType === "mouse";
      panned.current = false;
      if (ignore.current) return;
      if (moving.current) {
        // grab mid-flight: continue from the live position
        anim.current?.stop();
        grabbed.current = true;
      }
    },
    onPointerUp: () => {
      if (grabbed.current && !panned.current) {
        grabbed.current = false;
        goTo(Math.round(pos.get()));
      }
    },
    onPanStart: () => {
      if (ignore.current) return;
      pan.current = { decided: false, base: pos.get(), ox0: 0, start: activeRef.current };
      if (grabbed.current) {
        pan.current.decided = true;
        panned.current = true;
      }
    },
    onPan: (_: PointerEvent, info: PanInfo) => {
      const p = pan.current;
      if (!p) return;
      if (!p.decided) {
        const ax = Math.abs(info.offset.x);
        const ay = Math.abs(info.offset.y);
        if (Math.max(ax, ay) < 10) return;
        if (ay >= ax) {
          pan.current = null; // vertical scroll wins
          return;
        }
        p.decided = true;
        panned.current = true;
        p.base = pos.get();
        p.ox0 = info.offset.x;
        anim.current?.stop();
        if (window.scrollY > 0) window.scrollTo(0, 0);
      }
      const w = width.get();
      const raw = p.base * w - (info.offset.x - p.ox0);
      const max = last * w;
      const px = raw < 0 ? -rubber(-raw, w) : raw > max ? max + rubber(raw - max, w) : raw;
      pos.set(px / w);
    },
    onPanEnd: (_: PointerEvent, info: PanInfo) => {
      const p = pan.current;
      pan.current = null;
      grabbed.current = false;
      if (!p || !p.decided) return;
      justPanned.current = true;
      setTimeout(() => (justPanned.current = false), 60);
      const w = width.get();
      const v = -info.velocity.x; // px/s, positive = towards later pages
      const to = Math.round((pos.get() * w + project(v)) / w);
      const n = clamp(to, p.start - 1, p.start + 1); // one page at a time
      goTo(n, v / w, Math.abs(v) > 300 ? 0.15 : 0); // bounce only if flicked
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (justPanned.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
  };

  return { pos, width, activeMV, active, selected, goTo, containerRef, bind };
}
