import { EventCard } from "./EventCard";
import { LABEL, ORDER, type Bucket, type EventItem, type PageKey } from "@/lib/events";

const DOT: Record<Bucket, string> = {
  upcoming: "bg-up",
  ongoing: "bg-[var(--on)]",
  past: "bg-[var(--past)]",
};

interface Props {
  page: PageKey;
  groups: Record<Bucket, EventItem[]> | null;
  flippedId: string | null;
  onFlip: (id: string) => void;
  onMore: (item: EventItem, opener: HTMLElement) => void;
}

export function PageSections({ page, groups, flippedId, onFlip, onMore }: Props) {
  if (!groups) return null; // waiting for today's date (client only)

  return (
    <>
      {ORDER.map((bucket) => {
        const items = groups[bucket];
        const title = `${bucket[0].toUpperCase()}${bucket.slice(1)} ${LABEL[page]}`;
        return (
          <section key={bucket} className="mt-9">
            <h2 className="mb-[.9rem] mt-0 flex items-center gap-[.55rem] text-[1.45rem] font-[650] leading-[1.2] tracking-[-0.02em]">
              <i className={`size-[.6rem] rounded-full ${DOT[bucket]}`} />
              {title}
              <small className="ml-auto text-[.85rem] font-semibold tracking-normal text-mut">
                {items.length || ""}
              </small>
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {items.length === 0 && (
                <p className="m-0 py-4 text-mut">
                  No {bucket} {LABEL[page].toLowerCase()}.
                </p>
              )}
              {items.map((item) => (
                <EventCard
                  key={item.id}
                  item={item}
                  flipped={flippedId === item.id}
                  onFlip={onFlip}
                  onMore={onMore}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
