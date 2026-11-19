"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TabBar } from "./TabBar";
import { PageSections } from "./PageSections";
import { BottomSheet, type SheetData } from "./BottomSheet";
import { EVENTS, PAGES, dhakaToday, groupEvents, type EventItem } from "@/lib/events";
import { usePager } from "@/lib/usePager";

interface SlotProps {
  index: number;
  active: number;
  activeMV: MotionValue<number>;
  pos: MotionValue<number>;
  width: MotionValue<number>;
  children: React.ReactNode;
}

/** One page. The active page stays in flow; its neighbours are stacked on top while sliding. */
function PageSlot({ index, active, activeMV, pos, width, children }: SlotProps) {
  const x = useTransform([pos, width], ([p, w]: number[]) => (index - p) * w);
  const display = useTransform(
    [pos, activeMV],
    ([p, a]: number[]) => (index === a || Math.abs(index - p) < 1 ? "block" : "none"),
  );
  const isActive = index === active;

  return (
    <motion.section
      id={`page-${PAGES[index]}`}
      aria-hidden={!isActive}
      style={{ x, display }}
      className={isActive ? "relative" : "absolute left-5 right-5 top-0"}
    >
      {children}
    </motion.section>
  );
}

export default function Momentum() {
  const reduce = useReducedMotion();
  const pager = usePager(PAGES);

  // "today" depends on the visitor's clock, so it is computed in the browser
  const [today, setToday] = useState("");
  useEffect(() => setToday(dhakaToday()), []);
  const grouped = useMemo(() => (today ? groupEvents(EVENTS, today) : null), [today]);

  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // the page behind the sheet scales back as the sheet comes up
  const progress = useMotionValue(0);
  const scale = useTransform(progress, [0, 1], [1, reduce ? 1 : 0.96]);

  const openSheet = (item: EventItem, el: HTMLElement) => {
    opener.current = el;
    setSheet({ name: item.name, date: item.dateText, text: item.details });
  };
  const closeSheet = () => {
    setSheet(null);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <Header />

      <motion.main
        style={{ scale, transformOrigin: "50% 0" }}
        className="mx-auto min-h-dvh max-w-[1100px] overflow-x-clip px-5 pb-32 will-change-transform"
      >
        <motion.div
          ref={pager.containerRef}
          {...pager.bind}
          onPointerCancel={pager.bind.onPointerUp}
          className="relative -mx-5 flow-root touch-pan-y touch-pinch-zoom overflow-x-clip px-5"
        >
          {PAGES.map((page, i) => (
            <PageSlot
              key={page}
              index={i}
              active={pager.active}
              activeMV={pager.activeMV}
              pos={pager.pos}
              width={pager.width}
            >
              <PageSections
                page={page}
                groups={grouped ? grouped[page] : null}
                flippedId={flippedId}
                onFlip={(id) => setFlippedId((cur) => (cur === id ? null : id))}
                onMore={openSheet}
              />
            </PageSlot>
          ))}
        </motion.div>
      </motion.main>

      <Footer />
      <TabBar pos={pager.pos} selected={pager.selected} onSelect={(i) => pager.goTo(i)} />
      {sheet && <BottomSheet data={sheet} onClose={closeSheet} progress={progress} />}
    </>
  );
}
