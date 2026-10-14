# EUCATEN — Actualidad — Etapa 9: cierre operativo de revisión

## Objetivo

Terminar de convertir el radar automático en una herramienta cómoda y controlada para el uso diario de Cata.

Esta etapa no suma nuevas fuentes. Ordena mejor lo que ya llega y agrega controles para evitar publicaciones incompletas o que una fuente falle durante días sin que nadie lo advierta.

## 1. "Atención alta" pasa a "Revisar primero"

La prioridad NO decide qué publicar.

Solo ordena qué conviene mirar antes cuando hay poco tiempo.

"Revisar primero" queda reservado para señales fuertes:
- fuente regulatoria prioritaria;
- cambio normativo o regulatorio;
- sanción, fraude o riesgo de cumplimiento;
- fallo judicial verificado.

Los umbrales se hicieron más exigentes para que la etiqueta no aparezca en casi toda la bandeja.

## 2. Vista "Para empezar"

El panel selecciona hasta 5 pendientes para comenzar.

Primero utiliza las novedades incorporadas desde la última revisión.
Si no hay novedades nuevas, toma los pendientes más relevantes.

Es una ayuda de lectura, no una decisión editorial.

## 3. Resumen de revisión

Se muestran de forma compacta:
- novedades nuevas;
- cantidad que conviene revisar primero;
- alertas jurisprudenciales todavía no verificadas;
- fuentes automáticas con observaciones.

## 4. Búsqueda y filtros

Cata puede filtrar pendientes por:
- texto;
- categoría;
- fuente.

Esto permite trabajar por tema sin recorrer toda la bandeja.

## 5. Estado de las fuentes

Cada ejecución del radar registra en Neon:
- última revisión;
- estado: correcta / con observaciones / falló;
- encontradas;
- nuevas;
- ya conocidas;
- omitidas;
- resumen del error cuando corresponde.

La tabla `actualidad_source_health` se crea automáticamente.

La recopilación principal nunca falla únicamente porque no pudiera guardarse el diagnóstico de salud.

## 6. Control antes de publicar

Antes de aprobar una publicación se valida:
- título suficiente;
- descripción breve de al menos 40 caracteres;
- al menos una categoría;
- enlace original válido;
- fecha válida y no futura.

Si algo falta:
- el botón Aprobar queda deshabilitado;
- la tarjeta explica qué falta;
- el servidor vuelve a validar igualmente antes de cambiar el estado.

La edición sigue disponible para corregirla.

## 7. Jurisprudencia

Las alertas sin fallo original verificado siguen pudiendo ser revisadas, pero se muestran claramente como no verificadas.

La prioridad nunca convierte por sí sola una nota de prensa o alerta en una sentencia verificada.

## 8. Lo que NO cambia

- No se publica automáticamente.
- No hay IA.
- No hay n8n.
- No hay APIs pagas.
- No cambia el cron.
- No se borran pendientes al marcar una revisión al día.
- La decisión final siempre queda en manos de Cata.
