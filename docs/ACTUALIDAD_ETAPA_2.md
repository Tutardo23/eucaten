# Actualidad — Etapa 2

Esta etapa agrega la base de datos de publicaciones y el circuito manual de estados.

## Qué cambia

- Neon se usa únicamente para guardar publicaciones.
- Los estados son `pending`, `published` y `rejected`.
- `/actualidad` muestra únicamente registros `published`.
- Si `DATABASE_URL` no está configurada, la página conserva el estado vacío actual.
- No se agrega ningún panel `/admin` todavía: se protege esa superficie hasta incorporar Clerk.
- No hay IA, n8n ni servicios externos pagos.

## Preparación local

1. Aplicar este parche sobre la copia que ya tiene la Etapa 1.
2. Ejecutar:

```bash
npm install
```

Esto instala `@neondatabase/serverless` y actualiza tu `package-lock.json` local.

3. Crear un proyecto gratuito de Neon y copiar su connection string.
4. En `.env.local` agregar:

```env
DATABASE_URL=postgresql://...
```

Nunca usar `NEXT_PUBLIC_DATABASE_URL`.

5. Crear el esquema:

```bash
npm run actualidad:db -- setup
```

6. Confirmar la conexión:

```bash
npm run actualidad:db -- check
```

## Prueba manual segura

Crear un registro de prueba:

```bash
npm run actualidad:db -- seed
```

Ver pendientes:

```bash
npm run actualidad:db -- list pending
```

Copiar el ID mostrado y publicarlo:

```bash
npm run actualidad:db -- publish <id>
```

Al abrir `/actualidad`, el registro de prueba aparecerá porque ya está `published`.

Volverlo a pendiente:

```bash
npm run actualidad:db -- pending <id>
```

O descartarlo:

```bash
npm run actualidad:db -- reject <id>
```

Eliminar todos los registros de prueba creados por este utilitario:

```bash
npm run actualidad:db -- clean-test
```

## Seguridad

- `DATABASE_URL` solo vive en servidor.
- No hay endpoints de escritura públicos.
- No hay `/admin` abierto.
- Todas las consultas usan parámetros del driver de Neon.
- La sentencia solo puede marcarse como verificada si existe `judgment_url`.
- El panel web se agrega recién cuando Clerk proteja la ruta.
