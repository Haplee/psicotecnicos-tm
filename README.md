# PSICOTÉCNICOS TM

Plataforma local de entrenamiento psicotécnico para preparar las aptitudes de acceso a Tropa y Marinería.

> Proyecto independiente de entrenamiento. No es una aplicación oficial del Ministerio de Defensa ni reproduce su plataforma de evaluación.

## Incluye

- Siete aptitudes: verbal, numérica, espacial, mecánica, perceptiva, memoria y razonamiento abstracto.
- 15 preguntas iniciales por aptitud (105 en total), con cuatro opciones y explicación de la respuesta.
- Entrenamiento libre y simulacros cronometrados por bloque.
- Simulacro global con los siete bloques.
- Todas las preguntas visibles en una sola pantalla.
- Fase de memorización independiente para el bloque de memoria.
- Corrección automática al entregar; las respuestas incorrectas y en blanco no restan.
- Diagramas SVG para cubos, palancas, poleas, engranajes, patrones y matrices.
- Historial local, estadísticas y repaso de errores.
- Exportación e importación de una copia JSON.
- Tema oscuro predeterminado y tema claro alternativo.
- PWA con caché para reutilizar la aplicación sin conexión después de la primera carga.
- Resultados imprimibles.

## Requisitos

- Node.js 20.19+ o 22.12+ recomendado.
- npm 10+ (también se puede usar pnpm).

## Inicio rápido en Windows

1. Descomprime el ZIP.
2. Abre la carpeta `psicotecnicos-tm`.
3. Haz doble clic en `INICIAR.bat`.
4. La primera vez instalará las dependencias. Después iniciará Vite.
5. Abre en el navegador la dirección local que aparezca en la terminal, normalmente `http://localhost:5173`.

También puedes hacerlo desde PowerShell:

```powershell
npm install
npm run dev
```

## Comprobar y construir

```powershell
npm run typecheck
npm run build
npm run preview
```

La carpeta de distribución se genera en `dist/`. La PWA registra su service worker en producción; para probar instalación y modo offline, utiliza `npm run build` y `npm run preview` o sirve `dist/` por HTTPS/localhost.

## Datos y privacidad

Los resultados y las preferencias se guardan en `localStorage` del navegador. No hay cuentas ni llamadas a una API. Exporta una copia desde Configuración antes de borrar los datos del navegador o cambiar de dispositivo. Esta primera versión mantiene un máximo de 50 resultados recientes para proteger el espacio de almacenamiento del navegador.

## Banco de preguntas

El banco inicial está en `src/data/questions.ts`. Cada objeto incluye identificador, aptitud, enunciado, cuatro opciones, índice de respuesta correcta, explicación, consejo, nivel y categoría. Se puede ampliar añadiendo preguntas con identificadores únicos.

## Ajustes predeterminados

- 7 minutos por bloque.
- 49 minutos para el simulacro completo.
- 45 segundos para leer el informe de memoria.

Estos valores son parámetros de entrenamiento, no una afirmación de que el Ministerio utilice exactamente esos tiempos.
