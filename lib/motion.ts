/** Resistance past an edge: the further you pull, the less it moves. */
export const rubber = (offset: number, dim: number, c = 0.55) =>
  (offset * dim * c) / (dim + c * Math.abs(offset));

/** Where a flick with this velocity (px/s) would come to rest, in px. */
export const project = (velocity: number, decel = 0.99) =>
  ((velocity / 1000) * decel) / (1 - decel);

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const SPRING = (bounce = 0, visualDuration = 0.4) =>
  ({ type: "spring", visualDuration, bounce }) as const;
