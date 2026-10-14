"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./eucaten-video-section.module.css";

export function EucatenVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    setStarted(true);

    try {
      await video.play();
    } catch {
      // Si el navegador bloquea el play automático tras el click,
      // los controles quedan disponibles para iniciarlo manualmente.
    }
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="eucaten-video-title"
    >
      <div className={styles.watermark} aria-hidden="true">
        <Image
          src="/brand/eucaten-isotipo.png"
          alt=""
          width={489}
          height={475}
          sizes="280px"
        />
      </div>

      <div className={`shell ${styles.shell}`}>
        <div className={styles.mediaColumn}>
          <div className={styles.mediaMeta} aria-hidden="true">
            <span>Presentación institucional</span>
            <span>00:37</span>
          </div>

          <div className={styles.frame}>
            <video
              ref={videoRef}
              className={styles.video}
              controls={started}
              playsInline
              preload="none"
              poster="/media/eucaten-presentacion-poster.jpg"
              onEnded={() => setStarted(false)}
              aria-label="Presentación institucional de EUCATEN"
            >
              <source
                src="/media/eucaten-presentacion.mp4"
                type="video/mp4"
              />
              Tu navegador no puede reproducir este video.
            </video>

            {!started ? (
              <button
                className={styles.play}
                type="button"
                onClick={playVideo}
                aria-label="Reproducir presentación institucional de EUCATEN"
              >
                <span className={styles.playCircle} aria-hidden="true">
                  <span>▶</span>
                </span>
                <span className={styles.playText}>Ver presentación</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.copy}>
          <div className={styles.index} aria-hidden="true">
            <span>00</span>
            <i />
            <span>37</span>
          </div>

          <p className={styles.kicker}>EUCATEN / PRESENTACIÓN</p>

          <h2 id="eucaten-video-title">
            Una síntesis de quiénes somos.
          </h2>

          <p className={styles.body}>
            En menos de un minuto, nuestro enfoque, nuestras áreas de práctica
            y la manera en que acompañamos a las organizaciones.
          </p>

          <div className={styles.signature} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
