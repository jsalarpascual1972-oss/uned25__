# UNED+25 — Dashboard de Estudio

Página estática inspirada en el diseño que enviaste: topbar, tarjeta de bienvenida con gradiente, estadísticas, Pomodoro funcional, Quiz rápido con modal, logros y FAB. Ligera y lista para **Vercel/Netlify/GitHub Pages**.

## Estructura
```
/
├─ index.html
├─ styles.css
└─ script.js
```

## Desarrollo local
Abre `index.html` en tu navegador.

## Deployment
- **Vercel**: importa el repo desde GitHub y despliega (no requiere build).
- **Netlify**: New site → Git → elige repo. Build command: _none_. Publish directory: `/`.
- **GitHub Pages**: Settings → Pages → Source: `main` → `(root)`.

## Funciones
- **Pomodoro**: 25/15/5 min, pausa/continuar, mensaje al completar y logro.
- **Quiz**: modal con 5 preguntas aleatorias, calcula aciertos, actualiza barra de progreso y logros.
- **Logros**: se añaden al completar Pomodoro o aprobar quiz.
- **Días restantes**: haz click en la pastilla “0 días” para definir la fecha del examen.
- **Tema oscuro/claro**: botón en la topbar; guarda preferencia en `localStorage`.

## Personaliza
- Colores en `:root` de `styles.css`.
- Preguntas del quiz en `QUESTIONS` de `script.js`.
- Textos de la interfaz en `index.html`.
