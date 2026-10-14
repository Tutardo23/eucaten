"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./eucaten-video-modal.module.css";

export function EucatenVideoModal() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const close = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setOpen(false);
  };

  const openVideo = () => {
    setOpen(true);

    // El click del usuario habilita reproducción en la mayoría de navegadores.
    // Si el navegador igualmente la bloquea, los controles quedan disponibles.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        void videoRef.current?.play().catch(() => undefined);
      });
    });
  };

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button className={styles.launcher} type="button" onClick={openVideo}>
        <span className={styles.launcherLine} aria-hidden="true" />
        <span className={styles.launcherIcon} aria-hidden="true">▶</span>
        <span className={styles.launcherCopy}>
          <small>EUCATEN EN 37 SEGUNDOS</small>
          <strong>Ver presentación institucional</strong>
        </span>
        <span className={styles.launcherTime}>00:37</span>
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="eucaten-video-modal-title"
          >
            <header className={styles.header}>
              <div>
                <p>EUCATEN / PRESENTACIÓN</p>
                <h2 id="eucaten-video-modal-title">Nuestra mirada, en 37 segundos.</h2>
              </div>

              <button
                className={styles.close}
                type="button"
                onClick={close}
                aria-label="Cerrar presentación"
              >
                ×
              </button>
            </header>

            <div className={styles.videoFrame}>
              <video
                ref={videoRef}
                className={styles.video}
                controls
                playsInline
                preload="metadata"
                poster="/media/eucaten-presentacion-poster.jpg"
              >
                <source src="/media/eucaten-presentacion.mp4" type="video/mp4" />
                Tu navegador no puede reproducir este video.
              </video>
            </div>

            <footer className={styles.footer}>
              <span>Presentación institucional</span>
              <span>00:37</span>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
