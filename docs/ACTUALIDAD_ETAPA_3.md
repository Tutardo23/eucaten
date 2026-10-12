# EUCATEN — Actualidad — Etapa 3

Esta etapa agrega el panel privado `/admin/actualidad` con autenticación Clerk.

## Qué cambia

- El panel nace protegido; no hay endpoints públicos de escritura.
- Iniciar sesión en Clerk no alcanza: el correo además debe estar incluido en `ACTUALIDAD_ADMIN_EMAILS`.
- Si `ACTUALIDAD_ADMIN_EMAILS` está vacío, nadie puede administrar.
- Cata puede ver Pendientes, Publicadas y Descartadas.
- Puede Aprobar, Editar, Descartar y volver una publicación a Pendientes.
- Puede crear una publicación manual para pruebas o cargas puntuales.
- Las acciones del panel vuelven a verificar la sesión y autorización en el servidor.
- La web pública `/actualidad` sigue mostrando únicamente `published`.

## 1. Instalar la dependencia

Después de copiar el parche:

```powershell
npm install
```

## 2. Configurar Clerk

Crear o vincular una aplicación de Clerk para EUCATEN y colocar en `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

No subir `.env.local` a GitHub.

## 3. Autorizar administradores

En `.env.local` agregar el correo con el que vas a iniciar sesión en Clerk:

```env
ACTUALIDAD_ADMIN_EMAILS=tu-correo@ejemplo.com
```

Para más de una persona:

```env
ACTUALIDAD_ADMIN_EMAILS=correo1@ejemplo.com,correo2@ejemplo.com
```

La comparación ignora mayúsculas/minúsculas y espacios alrededor de las comas.

## 4. Neon

Conservar la `DATABASE_URL` que ya funcionó en la Etapa 2.

```env
DATABASE_URL=...
```

No hace falta ejecutar una migración nueva en esta etapa.

## 5. Probar

```powershell
npm run typecheck
npm run build
npm run dev
```

Abrir:

```text
http://localhost:3000/admin/actualidad
```

Comportamiento esperado:

1. Si Clerk no está configurado, el panel no muestra datos y avisa que falta configuración.
2. Si no hay sesión, redirige al inicio de sesión de Clerk.
3. Si el correo no está autorizado, muestra acceso no habilitado y no carga publicaciones.
4. Si el correo está autorizado, abre el panel editorial.
5. Aprobar una publicación la muestra en `/actualidad`.
6. Descartarla la retira de la web pública.

## Seguridad

- `CLERK_SECRET_KEY` y `DATABASE_URL` son variables solo de servidor.
- `ACTUALIDAD_ADMIN_EMAILS` también es solo de servidor.
- No se agregó ninguna API pública de creación/edición.
- Cada Server Action verifica nuevamente la cuenta autorizada.
- La autorización es "deny by default": sin correos permitidos, nadie accede.
