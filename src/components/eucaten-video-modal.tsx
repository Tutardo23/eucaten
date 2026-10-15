"use client";

import { useRef, useState } from "react";
import styles from "./eucaten-video-modal.module.css";

export function EucatenVideoModal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  const toggleSound = () => {
    const video = videoRef.current;
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
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => undefined);
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <div className={styles.heroVideo}>
      <div className={styles.meta} aria-hidden="true">
        <span>Presentación institucional</span>
        <span>00:37</span>
      </div>

      <div className={styles.frame}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/eucaten-presentacion-poster.jpg"
          aria-label="Presentación institucional de EUCATEN"
        >
          <source src="/media/eucaten-presentacion.mp4" type="video/mp4" />
          Tu navegador no puede reproducir este video.
        </video>

        <div className={styles.overlay} aria-hidden="true" />

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
  );
}
