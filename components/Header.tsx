import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="mx-auto max-w-[1100px] px-5 pb-2 pt-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-[length:clamp(2.4rem,7vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em]">
          Momentum
        </h1>
        <ThemeToggle />
      </div>
      <p className="mb-0 mt-1.5 text-[1.05rem] text-mut">
        Department of CSE · SIMT Engineering College
      </p>
    </header>
  );
}
