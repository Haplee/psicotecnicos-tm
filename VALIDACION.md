# Validación de PSICOTÉCNICOS TM

## Comprobaciones completadas

- 7 aptitudes definidas.
- 105 preguntas iniciales: exactamente 15 por aptitud.
- Cuatro opciones distintas por pregunta.
- Todas las preguntas tienen respuesta correcta, explicación, consejo, tema y nivel.
- Identificadores únicos y referencias a aptitudes válidas.
- Diagramas SVG disponibles para desarrollo de cubos, palancas, poleas, engranajes, símbolos, secuencias, matrices y sombreado.
- Comprobación sintáctica de los siete archivos TypeScript/TSX completada sin errores.
- Comprobación estática del banco completada sin preguntas incompletas ni IDs duplicados.

## Comprobación pendiente

No se ha podido ejecutar `npm install` ni `npm run build` en el entorno de creación porque no resuelve el dominio `registry.npmjs.org`. Por tanto, no se afirma que se haya realizado una compilación de producción ni una prueba visual en navegador. En un equipo con acceso al registro npm, ejecutar:

```powershell
npm install
npm run typecheck
npm run build
```

Si TypeScript o Vite detectan una incompatibilidad de versión, se podrá ajustar desde el proyecto.

## Criterio de contenido

Las 105 preguntas iniciales son ejercicios originales de entrenamiento redactados para esta plataforma. No son preguntas oficiales ni están atribuidas al Ministerio de Defensa. Las explicaciones y el tiempo de práctica son recursos pedagógicos.
