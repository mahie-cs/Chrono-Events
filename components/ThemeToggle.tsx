"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("tt");
      setTimeout(() => root.classList.remove("tt"), 400);
    }
    root.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage can be unavailable */
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.1 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="glass grid size-11 flex-none cursor-pointer place-items-center rounded-full border border-glass-edge bg-glass p-0 text-fg shadow-[0_2px_12px_rgba(0,0,0,.1)] backdrop-blur-[24px] backdrop-saturate-[180%]"
    >
      <motion.svg
        key={dark ? "moon" : "sun"}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", visualDuration: 0.4, bounce: 0.2 }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[22px]"
        aria-hidden
      >
        {dark ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </motion.svg>
    </motion.button>
  );
}
