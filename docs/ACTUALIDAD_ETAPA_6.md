# EUCATEN — Actualidad — Etapa 6

## Objetivo

Ampliar la recopilación automática que ya funciona con UIF incorporando dos fuentes
primarias definidas por Catalina:

- Banco Central de la República Argentina (BCRA)
- Comisión Nacional de Valores (CNV)

No se incorpora IA, n8n, APIs de noticias ni servicios pagos.

## Qué se consulta

### BCRA

Se consulta la sección oficial de Noticias del Banco Central.

El colector NO guarda todas las noticias. Solo conserva candidatos que las reglas
clasifican en alguna de estas áreas:

- Compliance y prevención de lavado de activos
- Fintech y medios de pago
- Prevención de fraude

Esto evita incorporar discursos institucionales, aniversarios, información
macroeconómica general u otras publicaciones ajenas al criterio de EUCATEN.

### CNV

Se consulta la sección oficial de Noticias de la Comisión Nacional de Valores en
Argentina.gob.ar.

Solo se guardan candidatos vinculados con:

- Compliance y prevención de lavado de activos
- Fintech y medios de pago
- Prevención de fraude
- Integridad corporativa

## Seguridad y estabilidad

- Solo se permiten dominios oficiales expresamente autorizados.
- Cada fuente se ejecuta de manera aislada.
- Si una fuente falla, las demás siguen funcionando.
- La deduplicación existente de Neon evita volver a crear una publicación ya capturada.
- Todo lo nuevo se guarda siempre como `pending`.
- Ninguna fuente puede publicar automáticamente.

## Cron

No cambia la configuración del cron.

El mismo endpoint que antes ejecutaba UIF ahora procesa:

1. UIF
2. BCRA
3. CNV

Vercel continúa realizando una sola ejecución diaria.

## Próximo paso

Después de validar calidad y ruido de estas tres fuentes, ampliar a:

- GAFI
- GAFILAT
- Boletín Oficial

La jurisprudencia se mantiene para una etapa posterior por requerir reglas de
verificación específicas.
