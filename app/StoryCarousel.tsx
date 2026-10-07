"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const SLIDES = [
  { src: "/images/gallery-1.png", alt: "Ultraviolet light tunnel inside Chamber I" },
  { src: "/images/gallery-2.png", alt: "A glowing cocktail at the chamber bar" },
  { src: "/images/gallery-3.png", alt: "Berlin skyline at first light from the roof" },
];

const AUTOPLAY_MS = 5000;

export default function StoryCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (!el || !slide) return;
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: "smooth" });
    setActive(i);
  }, []);

  // keep the dots in sync with swipes / scrolling
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = el.children[0] as HTMLElement;
        const stride = (el.children[1] as HTMLElement).offsetLeft - first.offsetLeft;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
        const i = atEnd ? SLIDES.length - 1 : Math.round(el.scrollLeft / stride);
        setActive(Math.max(0, Math.min(SLIDES.length - 1, i)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // autoplay: mobile only (desktop shows all three), pauses on interaction, off for reduced motion
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 899px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || viewing !== null || !mobile.matches || reduced.matches) return;
    const id = setInterval(() => goTo((active + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active, paused, viewing, goTo]);

  const step = useCallback(
    (d: number) => setViewing((v) => (v === null ? v : (v + d + SLIDES.length) % SLIDES.length)),
    [],
  );

  useEffect(() => {
    if (viewing === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewing(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewing, step]);

  return (
    <>
      <div
        className={styles.carousel}
        role="region"
        aria-roledescription="carousel"
        aria-label="The invitation, in scenes"
        onPointerDown={() => setPaused(true)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className={styles.track} ref={track}>
          {SLIDES.map((s, i) => (
            <div
              key={s.src}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
            >
              <button
                type="button"
                className={styles.slideBtn}
                onClick={() => setViewing(i)}
                aria-label={`Open image ${i + 1}: ${s.alt}`}
              >
                <Image src={s.src} alt={s.alt} fill sizes="(min-width: 900px) 33vw, 100vw" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => goTo((active - 1 + SLIDES.length) % SLIDES.length)}
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => goTo((active + 1) % SLIDES.length)}
          aria-label="Next image"
        >
          →
        </button>
      </div>

      <div className={styles.storyboard}>
        <span className={styles.storyLabel}>Live pulse · 64% to midnight</span>
        <div className={styles.dotRow} role="group" aria-label="Choose image">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={`${styles.dotBtn} ${i === active ? styles.dotOn : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === active}
            >
              <span aria-hidden="true">{i === active ? "●" : "○"}</span>
            </button>
          ))}
        </div>
      </div>

      {viewing !== null && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Image viewer">
          <div className={styles.lightboxBar}>
            <span>
              {viewing + 1} / {SLIDES.length}
            </span>
            <button ref={closeRef} type="button" className={styles.lightboxBtn} onClick={() => setViewing(null)}>
              CLOSE
            </button>
          </div>
          <div className={styles.lightboxStage}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SLIDES[viewing].src} alt={SLIDES[viewing].alt} />
          </div>
          <div className={styles.lightboxBar} style={{ justifyContent: "center" }}>
            <button type="button" className={styles.lightboxBtn} onClick={() => step(-1)} aria-label="Previous">
              ← PREV
            </button>
            <button type="button" className={styles.lightboxBtn} onClick={() => step(1)} aria-label="Next">
              NEXT →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
