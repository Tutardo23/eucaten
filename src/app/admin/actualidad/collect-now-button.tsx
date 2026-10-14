"use client";

import { useFormStatus } from "react-dom";

export function CollectNowButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="admin-button admin-collect-button is-primary"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Buscando novedades…" : "Buscar novedades ahora"}
    </button>
  );
}
