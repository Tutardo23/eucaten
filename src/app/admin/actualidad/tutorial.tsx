"use client";

import { useState } from "react";

type TutorialAction = (formData: FormData) => void | Promise<void>;

type Props = {
  openInitially: boolean;
  historicalCount: number;
  completeAction: TutorialAction;
};

const STEPS = [
  {
    eyebrow: "1 / 5",
    title: "El radar trabaja por vos",
    body:
      "Actualidad revisa las fuentes y prepara candidatos. No tenés que buscar noticias ni vaciar la bandeja todos los días: tu tarea es editorial.",
  },
  {
    eyebrow: "2 / 5",
    title: "Empezá por “Para empezar”",
    body:
      "Esa vista muestra como máximo cinco novedades. “Revisar primero” tampoco significa publicar: solo indica qué conviene mirar antes si tenés poco tiempo.",
  },
  {
    eyebrow: "3 / 5",
    title: "La fuente original manda",
    body:
      "Antes de aprobar podés abrir la fuente original. Si faltan datos básicos, el sistema bloquea la publicación hasta corregirlos.",
  },
  {
    eyebrow: "4 / 5",
    title: "Vos conservás el control",
    body:
      "Aprobar publica. Editar corrige título, resumen o categorías. Descartar saca una novedad de Pendientes, pero no la borra: queda registrada y puede recuperarse.",
  },
  {
    eyebrow: "5 / 5",
    title: "Tu bandeja empieza limpia",
    body:
      "Al tocar Empezar, tu trabajo comienza desde ese momento. Todo lo recopilado antes queda guardado en un histórico separado y no se mezcla con tus novedades diarias.",
  },
] as const;

export function ActualidadTutorial({
  openInitially,
  historicalCount,
  completeAction,
}: Props) {
  const [open, setOpen] = useState(openInitially);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <button
        className="admin-guide-button"
        type="button"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
      >
        ¿Cómo uso este panel?
      </button>

      {open ? (
        <div className="admin-guide-backdrop" role="presentation">
          <section
            className="admin-guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="actualidad-guide-title"
          >
            <button
              className="admin-guide-close"
              type="button"
              aria-label="Cerrar tutorial"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className="admin-guide-progress" aria-hidden="true">
              {STEPS.map((_, index) => (
                <span
                  key={index}
                  className={index <= step ? "is-active" : ""}
                />
              ))}
            </div>

            <p className="admin-guide-eyebrow">{current.eyebrow} · GUÍA RÁPIDA</p>
            <h2 id="actualidad-guide-title">{current.title}</h2>
            <p className="admin-guide-body">{current.body}</p>

            {isLast ? (
              <form className="admin-guide-start" action={completeAction}>
                <div className="admin-guide-clean-start">
                  <span>DÍA 1</span>
                  <strong>Vas a empezar con 0 novedades nuevas.</strong>
                  <p>
                    {historicalCount > 0
                      ? `Las ${historicalCount} publicaciones pendientes que ya existían quedan en “Histórico previo a tu inicio”.`
                      : "Si ya existiera contenido previo, quedaría apartado como histórico."}
                  </p>
                </div>

                <button
                  className="admin-button is-primary admin-guide-finish"
                  type="submit"
                >
                  Empezar
                </button>
              </form>
            ) : (
              <div className="admin-guide-actions">
                <button
                  className="admin-guide-secondary"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Ahora no
                </button>

                <div>
                  {step > 0 ? (
                    <button
                      className="admin-guide-secondary"
                      type="button"
                      onClick={() => setStep((value) => Math.max(0, value - 1))}
                    >
                      Anterior
                    </button>
                  ) : null}
                  <button
                    className="admin-button is-primary"
                    type="button"
                    onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
