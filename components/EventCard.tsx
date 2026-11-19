"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EventItem } from "@/lib/events";

export const LIM = 110;

const ACCENT: Record<EventItem["status"], string> = {
  upcoming: "[--c:var(--up)]",
  ongoing: "[--c:var(--on)]",
  past: "[--c:var(--past)]",
  postponed: "[--c:var(--postpone)]",
  cancelled: "[--c:var(--past)]",
};

interface Props {
  item: EventItem;
  flipped: boolean;
  onFlip: (id: string) => void;
  onMore: (item: EventItem, opener: HTMLElement) => void;
}

const FACE =
  "face absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border border-line bg-card p-[1.2rem] shadow-[0_1px_2px_var(--line),0_6px_20px_rgba(0,0,0,.05)] [backface-visibility:hidden]";

export function EventCard({ item, flipped, onFlip, onMore }: Props) {
  const reduce = useReducedMotion();
  const long = item.details.length > LIM;
  const text = long ? item.details.slice(0, LIM) + "…" : item.details;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onClick={() => onFlip(item.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onFlip(item.id);
        }
      }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      className={`${ACCENT[item.status]} h-[200px] cursor-pointer touch-manipulation select-none outline-offset-[3px] [perspective:900px]`}
    >
      {/* the card flips on a spring: interruptible, so a second tap reverses mid-flip */}
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped && !reduce ? 180 : 0 }}
        transition={{ type: "spring", visualDuration: 0.5, bounce: 0 }}
      >
        <div className={`${FACE} ${reduce && flipped ? "opacity-0" : ""}`}>
          <h3 className="m-0 text-[1.3rem] font-[650] leading-[1.2] tracking-[-0.015em]">
            {item.name}
          </h3>
          <span className="mt-auto self-start rounded-full bg-[color-mix(in_srgb,var(--c)_13%,transparent)] px-[.65rem] py-1 text-[.82rem] font-semibold tracking-[.01em] text-[var(--c)]">
            {item.dateText}
          </span>
        </div>

        <div
          className={`${FACE} ${reduce ? "" : "[transform:rotateY(180deg)]"} ${
            reduce && !flipped ? "pointer-events-none opacity-0" : ""
          }`}
        >
          <h4 className="m-0 mb-1.5 text-base font-[650] leading-tight tracking-[-0.01em]">
            {item.name}
          </h4>
          <p
            className={`m-0 flex-1 overflow-hidden text-[.92rem] leading-[1.45] text-mut ${
              long ? "[mask-image:linear-gradient(#000_70%,transparent)]" : ""
            }`}
          >
            {text}
          </p>
          {long && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMore(item, e.currentTarget);
              }}
              className="mt-2 cursor-pointer self-start rounded-full border-0 bg-sel px-[.85rem] py-[.35rem] text-[.85rem] font-semibold text-fg active:scale-95"
            >
              Show more
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
