# EUCATEN — Actualidad — Etapa 8: control editorial

## Objetivo

Ayudar a Catalina a revisar un radar cada vez más grande sin convertir la bandeja en una tarea agotadora ni delegar decisiones editoriales al sistema.

## Qué cambia

### 1. Prioridad explicable, sin IA

Cada pendiente recibe una señal editorial calculada con reglas determinísticas:

- Atención alta
- Atención media
- Seguimiento

La prioridad toma en cuenta la fuente, la presencia de cambios normativos, sanciones, fraude, PLA/FT y jurisprudencia. La tarjeta muestra los motivos. La prioridad solo ordena; nunca publica, aprueba ni descarta.

### 2. Nuevas desde la última revisión

Se agrega un punto de revisión por usuario administrador.

"Marcar revisión al día" NO cambia el estado de ninguna noticia. Solo guarda hasta qué momento se revisó la bandeja. Los pendientes anteriores siguen disponibles en "Todas las pendientes".

La tabla de estado se crea automáticamente en Neon la primera vez. No requiere ejecutar SQL manual.

### 3. Tres vistas de trabajo

- Nuevas desde mi revisión
- Atención alta
- Todas las pendientes

Cuando hay novedades nuevas, esa vista queda como foco predeterminado. Si no hay nuevas, se muestran todas.

### 4. Jurisprudencia controlada

Cuando una noticia informa una decisión judicial pero todavía no se verificó el documento judicial original, la tarjeta muestra una advertencia explícita: "Fallo no verificado".

Una sentencia solo puede mostrarse como verificada si el registro ya contiene el enlace judicial y `judgmentVerified=true`.

Las fuentes judiciales que no tienen un canal estable, reutilizable y verificable continúan en "seguimiento controlado". No se saltan CAPTCHA, paywalls ni controles de acceso.

### 5. Transparencia de cobertura

El panel muestra las fuentes que todavía están en seguimiento manual/controlado y explica por qué no se automatizan.

### 6. Etiquetas sectoriales

Cámara Argentina Fintech y ALEA se muestran en el panel como "Organización sectorial" en lugar de "Medio especializado". Esto es solo una mejora editorial de presentación y no modifica la base de datos.
