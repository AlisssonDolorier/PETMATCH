# Puesta en marcha en GitHub

El repositorio local ya tiene el historial completo: `main`, `develop`, ramas
`feature/*` mergeadas sin *fast-forward*, Conventional Commits y tags de
versión. Falta publicarlo y crear los Issues, Milestones y Releases que evalúa
la especificación (§79-§83, §94).

## Atajo: hacerlo todo de una vez

Una vez tengas la CLI de GitHub autenticada, un solo comando deja el
repositorio publicado con sus Milestones, Issues y Releases:

```bash
winget install GitHub.cli     # si aún no la tienes
gh auth login                 # abre el navegador para autorizar

bash scripts/github-setup.sh              # repositorio privado
bash scripts/github-setup.sh petmatch --public   # o público
```

El script es idempotente: si algo ya existe lo salta, así que puedes
ejecutarlo varias veces sin duplicar nada. El resto de esta guía explica
qué hace cada paso, por si prefieres ir a mano.

---

## 1. Crear el repositorio y subir el historial

```bash
# Con la CLI de GitHub
gh repo create petmatch --private --source=. --remote=origin

# O a mano, tras crearlo desde la web
git remote add origin https://github.com/<usuario>/petmatch.git
```

```bash
git push -u origin main
git push origin develop
git push origin --tags
```

> Sube `main` primero: así queda como rama por defecto.

Después, en **Settings → Branches**, protege `main`:
requiere Pull Request y que el check de CI pase antes de fusionar. Es lo que
convierte el flujo del §80 en algo real y no sólo declarado.

## 2. Integración continua

`.github/workflows/ci.yml` ya está en el repositorio. En cuanto subas el
código, cada push y cada Pull Request ejecutará:

1. `npm run lint`
2. Las pruebas de API contra el almacén en memoria
3. Las migraciones sobre un PostgreSQL 16 real
4. Las mismas pruebas de API contra PostgreSQL
5. Las pruebas de interfaz
6. La compilación del frontend

Correr la suite dos veces no es redundante: es lo que demuestra que ambos
motores de persistencia se comportan igual.

## 3. Milestones

Créalos antes que los Issues, para poder asignarlos al vuelo (§83):

| Milestone | Contenido |
| --- | --- |
| `v0.1 — BASE` | Repositorio, frontend, backend, base de datos |
| `v0.2 — USUARIOS` | Registro, login, roles, perfiles |
| `v0.3 — MASCOTAS` | CRUD, imágenes, búsqueda, filtros, perfil |
| `v0.4 — ADOPCIONES` | Favoritos, solicitudes, estados, entrevistas, adopciones |
| `v0.5 — REFUGIOS` | Perfil, gestión, estadísticas |
| `v0.6 — ADMINISTRACIÓN` | Usuarios, refugios, mascotas, solicitudes, reportes |
| `v0.7 — CALIDAD` | Validaciones, errores, notificaciones, auditoría, testing |
| `v1.0 — FINAL` | Documentación, deploy, README, release |

```bash
gh api repos/:owner/:repo/milestones -f title='v0.1 — BASE' \
  -f description='Repositorio, frontend, backend y base de datos'
```

## 4. Issues

Los 36 issues del §82, con el milestone al que pertenecen. Todos corresponden
a trabajo ya realizado: sirven como trazabilidad del proceso, así que ciérralos
enlazando el commit o la rama correspondiente.

| # | Título | Milestone |
| --- | --- | --- |
| 001 | Configurar repositorio | v0.1 |
| 002 | Crear frontend | v0.1 |
| 003 | Crear backend | v0.1 |
| 004 | Configurar PostgreSQL | v0.1 |
| 005 | Crear modelos | v0.1 |
| 006 | Registro | v0.2 |
| 007 | Login | v0.2 |
| 008 | Roles | v0.2 |
| 009 | Protección de rutas | v0.2 |
| 010 | CRUD mascotas | v0.3 |
| 011 | Imágenes | v0.3 |
| 012 | Búsqueda | v0.3 |
| 013 | Filtros | v0.3 |
| 014 | Paginación | v0.3 |
| 015 | Perfil mascota | v0.3 |
| 016 | Favoritos | v0.4 |
| 017 | Solicitudes | v0.4 |
| 018 | Estados | v0.4 |
| 019 | Entrevistas | v0.4 |
| 020 | Adopciones | v0.4 |
| 021 | Refugios | v0.5 |
| 022 | Perfil refugio | v0.5 |
| 023 | Dashboard adoptante | v0.5 |
| 024 | Dashboard refugio | v0.5 |
| 025 | Dashboard administrador | v0.6 |
| 026 | Notificaciones | v0.7 |
| 027 | Auditoría | v0.7 |
| 028 | Reportes | v0.6 |
| 029 | Validaciones | v0.7 |
| 030 | Errores | v0.7 |
| 031 | Testing backend | v0.7 |
| 032 | Testing frontend | v0.7 |
| 033 | Swagger | v1.0 |
| 034 | README | v1.0 |
| 035 | Deploy | v1.0 |
| 036 | Release | v1.0 |

Para crearlos de una vez:

```bash
# Ajusta el número de milestone según el orden en que los hayas creado
gh issue create --title "#001 Configurar repositorio" --milestone "v0.1 — BASE" \
  --body "Inicializar el monorepo, las ramas main y develop y las herramientas."
```

## 5. Releases

Los tags ya existen en local. Una vez subidos:

```bash
gh release create v1.0.0 --title "PetMatch v1.0.0" --notes "Versión completa del proyecto."
gh release create v1.0.1 --title "PetMatch v1.0.1" --notes "Correcciones de la auditoría de calidad."
gh release create v1.0.2 --title "PetMatch v1.0.2" --notes "Carga de variables de entorno."
gh release create v1.0.3 --title "PetMatch v1.0.3" --notes "Corrección de defectos: búsqueda indexable, foco del modal, pantalla de error y límites de peticiones."
gh release create v1.1.0 --title "PetMatch v1.1.0" --notes "Recuperación de contraseña, verificación de correo, subida de imágenes, documentos legales y CI."
```

## 6. Pull Requests

El historial local usa merges sin *fast-forward*, que es la huella que deja un
Pull Request. Para el trabajo que quede por delante, el flujo del §80:

```bash
git checkout develop
git checkout -b feature/lo-que-sea
# … commits …
git push -u origin feature/lo-que-sea
gh pr create --base develop --title "feat: lo que sea" --fill
```

## Comprobación final

- [ ] `main` y `develop` visibles en GitHub
- [ ] Los tags aparecen en la pestaña de Releases
- [ ] El check de CI en verde
- [ ] `main` protegido, exigiendo PR y CI
- [ ] Milestones creados y con Issues asignados
- [ ] Los Issues ya resueltos, cerrados

## Evidencias de las semanas 7 a 15

| Semana | Evidencia de PetMatch |
| --- | --- |
| 7 | Repositorio compartido y commits de dos cuentas. [Cambio de registro de Luxznff](https://github.com/AlisssonDolorier/PETMATCH/commit/54e982f) e [integración de AlisssonDolorier](https://github.com/AlisssonDolorier/PETMATCH/commit/6b0b9f6). |
| 8 | Ramas main y develop. El [PR 1](https://github.com/AlisssonDolorier/PETMATCH/pull/1) integró dos historiales, resolvió el conflicto del README y conservó la especificación PDF. |
| 9 | El historial ayuda a recuperar cambios perdidos y las ramas con PR ayudan a detectar cambios incompatibles antes de integrarlos. La revisión de un compañero se registra en el PR y la documentación técnica vive en el repositorio. |
| 10 | El [hito de entrega](https://github.com/AlisssonDolorier/PETMATCH/milestone/1) agrupa los tickets. Para el tamaño del equipo y la necesidad de enlazar código y tareas, GitHub Issues permite seguir el trabajo desde el mismo repositorio. |
| 11 | La [tarea de evidencias](https://github.com/AlisssonDolorier/PETMATCH/issues/2) pasa de en curso a revisión con el PR y se cierra al fusionarlo. En GitHub Projects se podría seguir ese mismo ticket como tarjeta. En Trello se podría mover una tarjeta de validación del registro de Por hacer a Hecho y adjuntar el enlace al PR. |
| 12 | El [incidente 3](https://github.com/AlisssonDolorier/PETMATCH/issues/3) documenta la diferencia de fechas según la zona horaria, la corrección y su prueba de regresión. |
| 13 | [GitHub Actions en main](https://github.com/AlisssonDolorier/PETMATCH/actions/runs/44734554495) ejecutó lint, migraciones de prueba, 159 pruebas de backend en memoria, las mismas 159 en PostgreSQL, 135 de frontend y la compilación. Las 453 ejecuciones de pruebas aprobaron. |
| 14 | [v1.4.1](https://github.com/AlisssonDolorier/PETMATCH/releases/tag/v1.4.1) identifica el código validado. El Blueprint de Render aplica migraciones antes de iniciar la API. El [ticket 4](https://github.com/AlisssonDolorier/PETMATCH/issues/4) registra las verificaciones pendientes de producción. |
| 15 | Render y Vercel permiten centralizar la publicación y delegar infraestructura. El plan gratuito de Render limita el acceso a Shell, por lo que el arranque del servicio incluye la migración. La validación en las URLs finales sigue pendiente. |
