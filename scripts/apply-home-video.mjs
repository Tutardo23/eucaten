import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = path.resolve(process.cwd(), "src/components/eucaten-home.tsx");
let source = await readFile(file, "utf8");

const importLine = 'import { EucatenVideoSection } from "@/components/eucaten-video-section";';
const importAnchor = 'import { siteContent } from "@/content/site";';

if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) {
    throw new Error("No encontré el import de siteContent en eucaten-home.tsx.");
  }
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const sectionMarkup = "      <EucatenVideoSection />";

if (!source.includes(sectionMarkup)) {
  const servicesMarker = '      <section className="services-section connected-section reveal-section" id="servicios" data-reveal>';
  const markerIndex = source.indexOf(servicesMarker);

  if (markerIndex === -1) {
    throw new Error("No encontré la sección Servicios en eucaten-home.tsx.");
  }

  source = `${source.slice(0, markerIndex)}${sectionMarkup}\n\n${source.slice(markerIndex)}`;
}

await writeFile(file, source, "utf8");
console.log("Video institucional insertado entre Hero y Servicios.");
