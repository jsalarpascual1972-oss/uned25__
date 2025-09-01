# UNED+25 — Estudio (v3.1)

**Arreglos y mejoras solicitadas**
- Navegación **real**: `Estudiar`, `Progreso` y `Calendario` son páginas separadas y funcionan.
- UI alineada: topbar centrado, hero y tarjetas con grid consistente.
- Eliminado **"Student"** del header y el **botón +** flotante.
- Dashboard enlazado al progreso del apartado **Estudiar** (global = media por materia; completados = leídos; racha y tiempo activos).
- Estudiar: asignatura **Nociones Jurídicas Básicas** con temas bloqueados hasta aprobar (media ≥6 + leído).
- Tema: subrayado, test y desarrollo con evaluación.
- Progreso: general + pestañas (Materias / Logros / Estadísticas).
- Calendario básico para apuntar sesiones (localStorage).

> Nota: es demo estática, datos en `localStorage`. Para multiusuario real necesitarás backend (Supabase/Firebase).

## Archivos
`index.html`, `estudiar.html`, `tema.html`, `progreso.html`, `calendario.html`, `admin.html`, `login.html`, `styles.css`, `app.js`.
