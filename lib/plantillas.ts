export type Plantilla = { id: string; nombre: string; desc: string; html: string };

export const PLANTILLAS: Plantilla[] = [
  {
    id: "cornell", nombre: "Apuntes Cornell", desc: "Pistas, apuntes y resumen",
    html: `<h2>Apuntes Cornell</h2><p><strong>Materia:</strong> </p><p><strong>Tema:</strong> </p><p><strong>Fecha:</strong> </p>
<table><tbody><tr><th><p>Pistas / Preguntas clave</p></th><th><p>Apuntes</p></th></tr><tr><td><p></p></td><td><p></p></td></tr></tbody></table>
<h3>Resumen</h3><p></p>`,
  },
  {
    id: "problema", nombre: "Problema resuelto", desc: "Datos, fórmulas, procedimiento, resultado",
    html: `<h2>Problema</h2><p><strong>Enunciado:</strong> </p><h3>Datos</h3><ul><li><p></p></li></ul><h3>Incógnita</h3><p></p>
<h3>Fórmulas</h3><ul><li><p></p></li></ul><h3>Procedimiento</h3><ol><li><p></p></li></ol><h3>Resultado</h3><p></p><h3>Verificación (unidades / sentido físico)</h3><p></p>`,
  },
  {
    id: "examen", nombre: "Resumen de examen", desc: "Conceptos, fórmulas, errores comunes",
    html: `<h2>Resumen de examen</h2><h3>Conceptos clave</h3><ul><li><p></p></li></ul><h3>Fórmulas importantes</h3><ul><li><p></p></li></ul>
<h3>Ejemplos tipo examen</h3><ol><li><p></p></li></ol><h3>Errores comunes</h3><ul><li><p></p></li></ul><h3>Dudas por resolver</h3><ul><li><p></p></li></ul>`,
  },
  {
    id: "clase", nombre: "Apunte de clase", desc: "Ideas principales, ejemplos, pendientes",
    html: `<h2>Clase</h2><p><strong>Tema:</strong> </p><p><strong>Fecha:</strong> </p><h3>Ideas principales</h3><ul><li><p></p></li></ul>
<h3>Ejemplos</h3><p></p><h3>Tarea / Pendientes</h3><ul><li><p></p></li></ul>`,
  },
  {
    id: "lab", nombre: "Reporte de laboratorio", desc: "Objetivo, datos, cálculos, conclusiones",
    html: `<h2>Práctica de laboratorio</h2><h3>Objetivo</h3><p></p><h3>Material</h3><ul><li><p></p></li></ul><h3>Procedimiento</h3><ol><li><p></p></li></ol>
<h3>Datos medidos</h3><table><tbody><tr><th><p>Medición</p></th><th><p>Valor</p></th><th><p>Unidad</p></th></tr><tr><td><p></p></td><td><p></p></td><td><p></p></td></tr></tbody></table>
<h3>Cálculos</h3><p></p><h3>Conclusiones</h3><p></p>`,
  },
];
