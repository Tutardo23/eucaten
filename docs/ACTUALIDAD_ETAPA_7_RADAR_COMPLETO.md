# EUCATEN — Actualidad — Etapa 7: radar ampliado

## Objetivo

Cubrir el mapa de fuentes solicitado por Cata sin convertir Actualidad en un agregador de ruido y sin automatizar accesos que requieran CAPTCHA, login, paywall o una verificación jurídica que el sistema todavía no pueda garantizar.

No se incorpora IA, n8n ni ningún servicio pago.

## Fuentes automáticas

El mismo recolector diario procesa ahora 19 fuentes:

- UIF
- BCRA
- CNV
- Boletín Oficial
- GAFI / FATF
- GAFILAT
- Cámara Argentina Fintech
- iProUP
- Oficina Anticorrupción
- AAIP
- IGJ
- Ministerio de Seguridad Nacional
- Ministerio Público Fiscal / Fiscales.gob.ar
- ALEA
- LOTBA
- Instituto Provincial de Lotería y Casinos de Buenos Aires
- Yogonet Latinoamérica
- G&M News
- SBC Noticias

Cada conector tiene su propio límite de antigüedad y cantidad de candidatos por corrida. Los medios secundarios usan filtros más estrictos que las fuentes primarias.

## Fuentes registradas, pero no automatizadas a ciegas

- Reguladores provinciales de juego: cobertura transversal mediante ALEA, LOTBA, IPLyC PBA y medios sectoriales; se evita inventar URLs y cada regulador individual se habilita cuando se verifica un feed estable.
- CASCBA / Juego Legal: no presenta un feed de novedades fechado y estable para el flujo actual.
- Secretaría de Jurisprudencia / CSJN: requiere extracción caso-a-caso con sentencia verificable.
- CIJ: no se saltean controles anti-bot o CAPTCHA.
- SAIJ: pendiente de un conector que garantice metadatos judiciales completos.
- SCBA: pendiente de conector verificable de jurisprudencia.
- Diario Judicial: puede servir como alerta, pero no prueba por sí solo la sentencia original.
- Microjuris Argentina: sujeto a condiciones de acceso y reutilización.

Esto es deliberado: “agregar todas las fuentes” no significa eludir restricciones ni presentar una nota periodística como si fuera un fallo judicial verificado.

## Jurisprudencia

Fiscales.gob.ar puede generar alertas relacionadas con litigios o condenas. Cuando el artículo menciona tribunal, sentencia, juicio o condena, la publicación puede quedar marcada como jurisprudencia **no verificada** (`judgmentVerified: false`).

Nunca se inventa fecha de sentencia, carátula ni URL judicial. La fecha de una noticia no se reutiliza como fecha del fallo.

## Boletín Oficial y deduplicación

Se incorpora la Primera Sección del Boletín Oficial con filtro por organismos y términos relevantes para las áreas de EUCATEN.

Además de la deduplicación por URL/fingerprint ya existente, el repositorio reconoce identificadores naturales de normas regulatorias, por ejemplo:

- Resolución UIF 109/2026
- Resolución General CNV 1069/2026
- Comunicación BCRA A 8471

Si la misma norma aparece en el organismo y en el Boletín Oficial con URLs distintas, se conserva una sola candidata.

## Filtros editoriales

Las seis categorías se mantienen exactamente iguales:

1. Compliance y prevención de lavado de activos
2. Fintech y medios de pago
3. Juegos de azar
4. Prevención de fraude
5. Integridad corporativa
6. Jurisprudencia y litigios

Las reglas incorporan términos en español e inglés para GAFI/FATF y fuentes internacionales, además de vocabulario de PSAV/VASP, activos virtuales, pagos, fraude, privacidad, integridad y regulación del juego.

## Control de carga

Para evitar que Cata abra el panel y encuentre cientos de publicaciones:

- se limita la antigüedad de cada fuente;
- se limita la cantidad procesada por corrida;
- medios especializados tienen filtros regulatorios estrictos;
- las fuentes corren en tandas;
- si una fuente falla, las demás continúan;
- todo entra en `pending`;
- nada se publica automáticamente.

La bandeja agrupada por fuente incorporada en la etapa anterior sigue siendo la interfaz de revisión.

## Cron y configuración

No hay cambios de base de datos ni nuevas variables de entorno.

El cron existente continúa llamando al mismo endpoint. Al desplegar este parche, la próxima corrida diaria utiliza automáticamente el radar ampliado.

El botón **Buscar novedades ahora** del panel usa exactamente el mismo motor y sigue protegido por Clerk.
