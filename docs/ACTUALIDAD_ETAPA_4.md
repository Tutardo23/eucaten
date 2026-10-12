# EUCATEN — Actualidad / Etapa 4

Esta etapa termina la experiencia pública de Actualidad. No conecta todavía fuentes automáticas.

## Incluye

- Página `/actualidad` editorial y responsive.
- Filtros por las seis categorías definidas por EUCATEN.
- Distinción visual entre fuente oficial, judicial, organismo internacional, medio especializado y prensa.
- Indicador de sentencia verificada / no verificada.
- Página individual `/actualidad/[slug]`.
- Metadata SEO individual y canonical por publicación.
- Sitemap dinámico con las publicaciones aprobadas.
- Bloque especial de jurisprudencia con tribunal, carátula, fecha y verificación cuando esos datos existen.
- La página pública recibe únicamente campos públicos; no expone fingerprint, aprobador ni timestamps internos.
- Solo las publicaciones con `status = published` pueden abrirse públicamente por slug.

## Prueba sugerida

1. Crear una publicación desde `/admin/actualidad`.
2. Aprobarla.
3. Abrir `/actualidad` y comprobar que aparece.
4. Probar filtros.
5. Abrir `Ver detalle`.
6. Volver al panel y pasarla a Pendiente o Descartada.
7. Comprobar que desaparece de `/actualidad` y que su URL individual devuelve 404.

No requiere variables de entorno ni dependencias adicionales respecto de la Etapa 3.
