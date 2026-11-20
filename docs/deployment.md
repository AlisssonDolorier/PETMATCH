# Despliegue de PetMatch

Arquitectura de despliegue: **frontend estático en Vercel** + **API y PostgreSQL en
Render**. Al final hay una alternativa con Docker Compose.

## 1. Base de datos y API en Render

1. Sube el repositorio a GitHub.
2. En Render: **New → Blueprint** y selecciona el repositorio. El archivo
   [`render.yaml`](../render.yaml) declara el servicio web y la base de datos.
3. Render crea automáticamente:
   - `DATABASE_URL`, tomada de la base de datos gestionada.
   - `JWT_SECRET`, generado como valor aleatorio.
4. Define `FRONTEND_URL` a mano cuando tengas el dominio de Vercel (paso 2.5).
   Sin este valor, CORS rechazará las peticiones del frontend.
5. El comando de arranque de Render ejecuta `npm run db:migrate` antes de
   iniciar la API. Revisa el registro del despliegue para confirmar el resultado.
   Las migraciones ya aplicadas se omiten en los reinicios.

6. Comprueba <https://tu-api.onrender.com/api/health>. Debe responder
   `"database": "postgresql"`. Si dice `"memory"`, falta `DATABASE_URL`.

## 2. Frontend en Vercel

1. **Add New → Project** e importa el mismo repositorio.
2. **Root Directory:** `frontend`.
3. **Build Command:** `npm run build` · **Output Directory:** `dist`.
4. Variable de entorno: `VITE_API_URL=https://tu-api.onrender.com/api`
   (con `/api` al final y **sin** barra final).
5. Tras el despliegue, copia el dominio y vuelve a Render para poner
   `FRONTEND_URL=https://tu-app.vercel.app`. Redespliega el servicio.

El archivo [`frontend/vercel.json`](../frontend/vercel.json) reescribe todas las
rutas a `index.html`; sin él, recargar `/mascotas/12` daría un 404.

## 3. Verificación posterior

- `GET /api/health` → `"database": "postgresql"`.
- `/api/docs` muestra Swagger UI.
- La portada carga estadísticas reales (no ceros).
- Regístrate como adoptante y como refugio.
- Con la cuenta administradora, verifica el refugio nuevo.
- Publica una mascota, envía una solicitud y recorre el flujo completo hasta
  registrar la adopción.
- Comprueba que la mascota quedó en estado `ADOPTADA` y que la acción aparece en
  el registro de auditoría.

## 4. Alternativa: Docker Compose

```bash
cp .env.example .env
# Edita JWT_SECRET antes de exponerlo a la red
docker compose --profile full up --build
```

- Frontend: <http://localhost:8080>
- API: <http://localhost:4000/api>
- PostgreSQL: `localhost:5432`

El servicio `api` aplica migraciones y datos de demostración al arrancar. Para
desarrollar en local basta con la base de datos:

```bash
docker compose up -d db
npm run dev
```

## 5. Alternativa: servidor propio

```bash
git clone <repositorio> && cd petmatch
npm ci
npm run build -w frontend

export NODE_ENV=production
export DATABASE_URL=postgresql://usuario:clave@localhost:5432/petmatch
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
export FRONTEND_URL=https://tu-dominio.com

npm run db:migrate
npm start
```

Sirve `frontend/dist` con nginx (hay una configuración de ejemplo en
[`docker/nginx.conf`](../docker/nginx.conf)) y usa un gestor de procesos como
systemd o PM2 para la API.

## Antes de abrir al público

Estos puntos no son opcionales si la plataforma va a recibir usuarios reales:

| Punto | Por qué | Cómo |
| --- | --- | --- |
| **Datos del responsable legal** | Los documentos legales llevan marcadores de posición; sin datos reales no cumplen la Ley 29733 | Define `LEGAL_ORGANIZATION`, `LEGAL_CONTACT_EMAIL` y `LEGAL_ADDRESS` |
| **Revisión legal de los textos** | Los redactamos como borrador informado, no como asesoría | Que los revise alguien cualificado antes de publicarlos |
| **SMTP real** | Sin él la recuperación de contraseña no llega a nadie | Define `SMTP_HOST` y credenciales |
| **Resend** | Alternativa sencilla para el correo transaccional | Define `RESEND_API_KEY` y `RESEND_FROM` |
| **Almacenamiento persistente de imágenes** | El disco de Render es efímero: las fotos desaparecen en cada despliegue | Monta un disco persistente y apunta `UPLOAD_DIR`, o usa S3/Cloudinary |
| **Redis** | Sin él los límites de peticiones cuentan por instancia | Define `REDIS_URL` |
| **Copias de seguridad** | Sin ellas, un fallo de la base es irreversible | Activa los backups automáticos del proveedor |
| **Monitorización de errores** | Hoy los errores sólo quedan en `console.error` | Conecta un servicio de seguimiento (Sentry o similar) |
| **Contraseña del administrador** | Las del seed son públicas: están en este repositorio | Cámbiala tras el primer acceso, o no siembres datos de demostración |

## Lista de comprobación de seguridad

- [ ] `JWT_SECRET` es un valor aleatorio largo, distinto en cada entorno.
- [ ] `.env` **no** está en el repositorio (`.gitignore` ya lo cubre).
- [ ] `FRONTEND_URL` apunta al dominio real: CORS depende de ello.
- [ ] La contraseña del administrador se cambió tras el primer acceso.
- [ ] `NODE_ENV=production` — sin él, la API arrancaría con el secreto de
      desarrollo en lugar de fallar.
- [ ] La base de datos no está expuesta a internet.
- [ ] HTTPS activo (Render y Vercel lo proporcionan automáticamente).

## 6. Checklist de salida (imagen de entrega)

- [ ] **Publicar en GitHub:** subir el repositorio, proteger la rama principal y activar
      el workflow de CI de [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- [ ] **Desplegar en Render + Vercel:** importar [`render.yaml`](../render.yaml),
      configurar `VITE_API_URL` y copiar `FRONTEND_URL` al servicio de Render.
- [ ] **Capturas para el README:** capturar portada, explorador, detalle de mascota,
      panel de adoptante, panel de refugio y panel de administración; guardarlas en
      `docs/screenshots/` y enlazarlas desde el README.
- [ ] **API key de Resend:** crear la clave en Resend, verificar el dominio remitente,
      configurar `RESEND_API_KEY` y `RESEND_FROM` como secretos de producción.
- [ ] **Revisión legal:** completar `LEGAL_*` y hacer revisar
      [`TermsPage.jsx`](../frontend/src/pages/legal/TermsPage.jsx) y
      [`PrivacyPage.jsx`](../frontend/src/pages/legal/PrivacyPage.jsx) antes de abrir el registro.
- [ ] **Redis, backups, disco y monitorización:** configurar `REDIS_URL`, almacenamiento
      persistente para `UPLOAD_DIR`, backups automáticos de PostgreSQL y alertas para
      `/api/health` y los errores del servicio.

## Problemas frecuentes

| Síntoma | Causa habitual |
| --- | --- |
| El frontend carga pero no muestra datos | `VITE_API_URL` mal escrita, o falta `/api` al final |
| Errores de CORS en la consola | `FRONTEND_URL` no coincide con el dominio real |
| `"database": "memory"` en producción | Falta `DATABASE_URL` |
| Recargar una ruta interna da 404 | Falta la reescritura SPA (`vercel.json` o nginx) |
| La API no arranca en producción | Falta `DATABASE_URL` o `JWT_SECRET`: es intencionado |
| No hay ninguna cuenta administradora | Ejecuta `npm run db:seed`; el registro público no crea administradores |
