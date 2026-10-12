import type { ActualidadSourceType } from "./types";

export const ACTUALIDAD_SOURCE_TYPE_LABELS: Record<
  ActualidadSourceType,
  string
> = {
  official: "Fuente oficial",
  judicial: "Fuente judicial",
  international_organization: "Organismo internacional",
  specialized_media: "Medio especializado",
  press: "Prensa",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatActualidadDate(value: string) {
  return dateFormatter.format(new Date(value));
}
