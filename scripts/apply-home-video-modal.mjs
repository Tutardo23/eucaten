import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = path.resolve(process.cwd(), "src/components/eucaten-home.tsx");
let source = await readFile(file, "utf8");

const oldImport = 'import { EucatenVideoSection } from "@/components/eucaten-video-section";';
const newImport = 'import { EucatenVideoModal } from "@/components/eucaten-video-modal";';
const importAnchor = 'import { siteContent } from "@/content/site";';

source = source
  .replace(`${oldImport}\n`, "")
  .replace(`\n${oldImport}`, "")
  .replace(/\n\s*<EucatenVideoSection\s*\/>\s*\n/g, "\n\n");

if (!source.includes(newImport)) {
  if (!source.includes(importAnchor)) {
    throw new Error("No encontré el import de siteContent en eucaten-home.tsx.");
  }

  source = source.replace(importAnchor, `${importAnchor}\n${newImport}`);
}

if (!source.includes("<EucatenVideoModal />")) {
  const heroVisualMarker =
    '\n            <div className="hero-visual" aria-hidden="true">';

  const markerIndex = source.indexOf(heroVisualMarker);

  if (markerIndex === -1) {
    throw new Error("No encontré el bloque hero-visual en eucaten-home.tsx.");
  }

  const beforeHeroVisual = source.slice(0, markerIndex);
  const heroCopyClosing = beforeHeroVisual.lastIndexOf("\n            </div>");

  if (heroCopyClosing === -1) {
    throw new Error("No pude ubicar el cierre del contenido del hero.");
  }

  source =
    source.slice(0, heroCopyClosing) +
    '\n              <EucatenVideoModal />' +
    source.slice(heroCopyClosing);
}

await writeFile(file, source, "utf8");

console.log("Listo:");
console.log("- eliminada la sección independiente del video");
console.log("- agregado el acceso al video dentro del hero");
console.log("- modal institucional conectado");
