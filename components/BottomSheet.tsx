"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { project, rubber, SPRING } from "@/lib/motion";

export interface SheetData {
  name: string;
  date: string;
  text: string;
}

interface Props {
  data: SheetData;
  onClose: () => void;
  /** 0 = closed, 1 = fully open; the page behind scales back with it */
  progress: MotionValue<number>;
}

export function BottomSheet({ data, onClose, progress }: Props) {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const dragging = useRef<{ base: number } | null>(null);

  const hidden = useRef(typeof window === "undefined" ? 800 : window.innerHeight);
  const y = useMotionValue(hidden.current);
  const scrimOpacity = useTransform(y, (v) => Math.max(0, Math.min(1, 1 - v / hidden.current)));

  // keep the page-behind progress in sync with the sheet position
  useEffect(() => {
    const stop = scrimOpacity.on("change", (v) => progress.set(v));
    return () => {
      stop();
      progress.set(0);
    };
  }, [scrimOpacity, progress]);

  // open
  useEffect(() => {
    const h = (sheetRef.current?.offsetHeight ?? 400) + 40;
    hidden.current = h;
    y.set(h);
    if (reduce) y.set(0);
    else animate(y, 0, SPRING(0.2));
    doneRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = (velocity = 0) => {
    if (closing.current) return;
    closing.current = true;
    if (reduce) {
      onClose();
      return;
    }
    animate(y, hidden.current, { ...SPRING(0, 0.35), velocity, onComplete: onClose });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPanStart = (e: PointerEvent) => {
    const t = e.target as HTMLElement;
    const inText = textRef.current?.contains(t) && (textRef.current?.scrollTop ?? 0) > 0;
    if (inText || t.closest("[data-done]")) {
      dragging.current = null;
      return;
    }
    dragging.current = { base: y.get() };
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    const d = dragging.current;
    if (!d) return;
    const raw = d.base + info.offset.y;
    y.set(raw < 0 ? -rubber(-raw, hidden.current) : raw);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const d = dragging.current;
    dragging.current = null;
    if (!d) return;
    const v = info.velocity.y;
    if (y.get() + project(v, 0.998) > hidden.current / 2) close(v);
    else animate(y, 0, { ...SPRING(0.2), velocity: v });
  };

  return (
    <>
      <motion.div
        aria-hidden
        style={{ opacity: scrimOpacity }}
        onPointerDown={() => close()}
        className="fixed inset-0 z-20 bg-black/40"
      />
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        style={{ y }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        className="glass fixed inset-x-0 bottom-0 z-[21] mx-auto w-full max-w-[560px] touch-none rounded-t-[28px] border border-b-0 border-glass-edge bg-glass px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[.6rem] shadow-[0_-12px_50px_rgba(0,0,0,.25)] backdrop-blur-[40px] backdrop-saturate-[180%] will-change-transform"
      >
        <div className="mx-auto mb-4 h-[5px] w-[38px] rounded-[3px] bg-mut opacity-50" />
        <h3 id="sheet-title" className="m-0 text-[1.6rem] font-bold leading-[1.15] tracking-[-0.02em]">
          {data.name}
        </h3>
        <p className="mb-4 mt-[.4rem] font-semibold tracking-[.01em] text-up">{data.date}</p>
        <p
          ref={textRef}
          className="m-0 max-h-[45vh] touch-pan-y select-text overflow-auto text-[1.02rem] font-[450] leading-[1.55] tracking-[.005em]"
        >
          {data.text}
        </p>
        <button
          ref={doneRef}
          data-done
          type="button"
          onClick={() => close()}
          className="mt-[1.4rem] w-full cursor-pointer rounded-full border-0 bg-up p-3 text-base font-semibold text-white active:scale-95"
        >
          Done
        </button>
      </motion.div>
    </>
  );
}
