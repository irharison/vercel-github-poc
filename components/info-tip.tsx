"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Place = { top: number; left: number; maxHeight: number };

/**
 * A small "i" beside a figure. Hover or keyboard focus opens the note on a
 * desktop pointer. A tap pins it, including on a phone. Escape or a tap
 * outside closes a pinned note.
 */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [place, setPlace] = useState<Place | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 16);
      const margin = 8;
      const gap = 6;
      let left = rect.left;
      if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
      if (left < margin) left = margin;
      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const below = spaceBelow >= 96 || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(72, Math.min(220, below ? spaceBelow : spaceAbove));
      const top = below ? rect.bottom + gap : Math.max(margin, rect.top - gap - maxHeight);
      setPlace({ top, left, maxHeight });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || tipRef.current?.contains(target)) return;
      setPinned(false);
      setHover(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setHover(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <span className="inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
        className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-300 text-[11px] leading-none font-semibold text-stone-500 hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] dark:border-stone-600 dark:text-stone-400"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHover(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setHover(false);
        }}
        onFocus={() => setHover(true)}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && tipRef.current?.contains(next)) return;
          setHover(false);
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPinned((value) => !value);
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      {mounted && open && place
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{ top: place.top, left: place.left, maxHeight: place.maxHeight }}
              className="fixed z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-3 text-left text-xs leading-5 font-normal text-stone-700 shadow-lg dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
