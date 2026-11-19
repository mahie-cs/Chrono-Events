"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { LABEL, PAGES } from "@/lib/events";

interface Props {
  pos: MotionValue<number>;
  selected: number;
  onSelect: (i: number) => void;
}

export function TabBar({ pos, selected, onSelect }: Props) {
  // the pill is one tab wide; translating by p*100% of its own width lands on tab p
  const x = useTransform(pos, (p) => `${p * 100}%`);

  return (
    <nav
      aria-label="Sections"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-10 flex justify-center [transform:translateZ(0)]"
    >
      <div className="glass pointer-events-auto relative flex w-[min(92vw,420px)] rounded-full border border-glass-edge bg-glass p-[5px] shadow-glass backdrop-blur-[24px] backdrop-saturate-[180%]">
        <motion.div
          aria-hidden
          style={{ x }}
          className="absolute bottom-[5px] left-[5px] top-[5px] w-[calc((100%-10px)/3)] rounded-full bg-sel will-change-transform"
        />
        {PAGES.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={selected === i ? "page" : undefined}
            className={`relative z-[1] flex-1 cursor-pointer rounded-full border-0 bg-transparent px-1 py-[.6rem] text-center text-[.95rem] font-semibold tracking-[.005em] transition-colors duration-150 ${
              selected === i ? "text-fg" : "text-mut"
            }`}
          >
            {LABEL[p]}
          </button>
        ))}
      </div>
    </nav>
  );
}
