import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = path.resolve(process.cwd(), "src/components/eucaten-home.tsx");
let source = await readFile(file, "utf8");

const component = "<EucatenVideoModal />";

// 1) Quitamos cualquier instancia previa del componente para evitar duplicados.
//    El import NO se toca.
source = source.replace(/\s*<EucatenVideoModal\s*\/>\s*/g, "\n");

// 2) Ubicamos el div real de hero-copy sin depender de espacios/saltos de línea.
const heroCopyMatch = source.match(
  /<div\s+className=["']hero-copy hero-sequence["'][^>]*>/,
);

if (!heroCopyMatch || heroCopyMatch.index == null) {
  throw new Error(
    'No encontré <div className="hero-copy hero-sequence"> en eucaten-home.tsx.'
  );
}

const heroCopyStart = heroCopyMatch.index;
const openingEnd = heroCopyStart + heroCopyMatch[0].length;

// 3) Recorremos tags <div> / </div> para encontrar el cierre REAL del hero-copy.
const divTagRegex = /<div\b[^>]*>|<\/div>/g;
divTagRegex.lastIndex = openingEnd;

let depth = 1;
let closingStart = -1;
let tagMatch;

while ((tagMatch = divTagRegex.exec(source)) !== null) {
  if (tagMatch[0].startsWith("</div")) {
    depth -= 1;

    if (depth === 0) {
      closingStart = tagMatch.index;
      break;
    }
  } else {
    depth += 1;
  }
}

if (closingStart === -1) {
  throw new Error(
    "Encontré hero-copy pero no pude determinar dónde termina. No se modificó el archivo."
  );
}

// 4) Insertamos el video inmediatamente antes del cierre de hero-copy.
const indentation = "              ";
const insertion = `\n${indentation}${component}\n            `;

source =
  source.slice(0, closingStart) +
  insertion +
  source.slice(closingStart);

await writeFile(file, source, "utf8");

console.log("Listo:");
console.log("- video ubicado dentro de hero-copy");
console.log("- queda debajo del texto y los CTA");
console.log("- se eliminó cualquier instancia anterior para evitar duplicados");
console.log("- hero-visual/isotipo derecho queda limpio");
