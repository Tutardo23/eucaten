import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const file = path.resolve(process.cwd(), "src/components/eucaten-home.tsx");
let source = await readFile(file, "utf8");

const component = "<EucatenVideoModal />";

// Quitar cualquier instancia previa para evitar duplicados.
source = source.replace(/\s*<EucatenVideoModal\s*\/>\s*/g, "\n");

// Insertar dentro de hero-visual, inmediatamente después de hero-logo-stage.
const marker = `              </div>
            </div>
          </div>
        </section>`;

const replacement = `              </div>
              <EucatenVideoModal />
            </div>
          </div>
        </section>`;

if (!source.includes(marker)) {
  throw new Error(
    "No pude ubicar el final de hero-visual. No se modificó eucaten-home.tsx."
  );
}

source = source.replace(marker, replacement);

await writeFile(file, source, "utf8");

console.log("Listo:");
console.log("- video removido de la columna de texto");
console.log("- video integrado dentro del visual del hero");
console.log("- sin modal ni bloqueo de scroll");
