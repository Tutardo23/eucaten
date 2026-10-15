"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./eucaten-video-modal.module.css";

export function EucatenVideoModal() {
  const previewRef = useRef<HTMLVideoElement>(null);
  const expandedRef = useRef<HTMLVideoElement>(null);

  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSound = () => {
    const video = previewRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    if (video.paused) {
      void video.play().catch(() => undefined);
      setPaused(false);
    }
  };

  const togglePlayback = () => {
    const video = previewRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => undefined);
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const openExpanded = () => {
    const preview = previewRef.current;
    const currentTime = preview?.currentTime ?? 0;

    if (preview) preview.pause();

    setResumeTime(currentTime);
    setExpanded(true);
  };

  const closeExpanded = () => {
    const expandedVideo = expandedRef.current;
    const currentTime = expandedVideo?.currentTime ?? resumeTime;

    setExpanded(false);

    window.requestAnimationFrame(() => {
      const preview = previewRef.current;
      if (!preview) return;

      preview.currentTime = currentTime;
      preview.muted = muted;
      void preview.play().catch(() => undefined);
      setPaused(false);
    });
  };

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeExpanded();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, resumeTime, muted]);

  const expandedPlayer =
    mounted && expanded
      ? createPortal(
          <div
            className={styles.expandedLayer}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeExpanded();
            }}
          >
            <section
              className={styles.expandedCard}
              role="dialog"
              aria-modal="false"
              aria-label="Presentación institucional ampliada de EUCATEN"
            >
              <div className={styles.expandedTopbar}>
                <div>
                  <span>EUCATEN / PRESENTACIÓN</span>
                  <strong>Presentación institucional</strong>
                </div>

                <button
                  className={styles.close}
                  type="button"
                  onClick={closeExpanded}
                  aria-label="Cerrar video ampliado"
                >
                  ×
                </button>
              </div>

              <div className={styles.expandedFrame}>
                <video
                  ref={expandedRef}
                  className={styles.expandedVideo}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  poster="/media/eucaten-presentacion-poster.jpg"
                  onLoadedMetadata={(event) => {
                    event.currentTarget.currentTime = resumeTime;
                    void event.currentTarget.play().catch(() => undefined);
                  }}
                >
                  <source
                    src="/media/eucaten-presentacion.mp4"
                    type="video/mp4"
                  />
                  Tu navegador no puede reproducir este video.
                </video>
              </div>

              <div className={styles.expandedFooter}>
                <span>Click afuera o ESC para cerrar</span>
                <span>00:37</span>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className={styles.heroVideo}>
        <div className={styles.meta} aria-hidden="true">
          <span>Presentación institucional</span>
          <span>00:37</span>
        </div>

        <div className={styles.frame}>
          <button
            className={styles.expandHit}
            type="button"
            onClick={openExpanded}
            aria-label="Ampliar presentación institucional"
          >
            <video
              ref={previewRef}
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/media/eucaten-presentacion-poster.jpg"
              aria-hidden="true"
            >
              <source
                src="/media/eucaten-presentacion.mp4"
                type="video/mp4"
              />
            </video>

            <span className={styles.overlay} aria-hidden="true" />
            <span className={styles.expandLabel} aria-hidden="true">
              <span className={styles.expandIcon}>↗</span>
              <span>Ampliar</span>
            </span>
          </button>

          <button
            className={styles.playback}
            type="button"
            onClick={togglePlayback}
            aria-label={paused ? "Reproducir presentación" : "Pausar presentación"}
          >
            <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
          </button>

          <button
            className={styles.sound}
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Activar sonido" : "Silenciar presentación"}
          >
            <span className={styles.soundDot} aria-hidden="true" />
            <span>{muted ? "Activar sonido" : "Silenciar"}</span>
          </button>
        </div>
      </div>

      {expandedPlayer}
    </>
  );
}
