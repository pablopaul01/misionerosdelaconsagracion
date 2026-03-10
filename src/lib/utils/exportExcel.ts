// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx-js-style');

interface InscriptoRow {
  apellido: string;
  nombre: string;
  dni?: string;
}

const BORDER = { style: 'thin', color: { rgb: '000000' } };
const CELL_BORDER = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const TITLE_STYLE = {
  font:      { bold: true, sz: 13 },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const HEADER_STYLE = {
  font:      { bold: true, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border:    CELL_BORDER,
};

const DATA_STYLE = {
  alignment: { vertical: 'center' },
  border:    CELL_BORDER,
};

export function exportarListaAsistencia(
  inscriptos: InscriptoRow[],
  titulo: string,
  tituloVisible: string,
  includeFirma: boolean = true,
) {
  const cols    = includeFirma ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const headers = includeFirma
    ? ['Nº', 'Apellido', 'Nombre', 'DNI', 'Firma']
    : ['Nº', 'Apellido', 'Nombre', 'DNI'];
  const filas   = inscriptos.map((i, idx) => (
    includeFirma
      ? [idx + 1, i.apellido, i.nombre, i.dni ?? '', '']
      : [idx + 1, i.apellido, i.nombre, i.dni ?? '']
  ));

  // fila 1 = título, fila 2 = encabezados, filas 3+ = datos
  const aoa = [
    includeFirma ? [tituloVisible, '', '', '', ''] : [tituloVisible, '', '', ''],
    headers,
    ...filas,
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge A1:E1 para el título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: includeFirma ? 4 : 3 } },
  ];

  const maxApellido = Math.max(...inscriptos.map((i) => i.apellido.length), 'Apellido'.length);
  const maxNombre   = Math.max(...inscriptos.map((i) => i.nombre.length),   'Nombre'.length);

  const maxDni = Math.max(...inscriptos.map((i) => (i.dni ?? '').length), 'DNI'.length);

  ws['!cols'] = includeFirma
    ? [
        { wch: 5 },               // Nº
        { wch: maxApellido + 2 }, // Apellido
        { wch: maxNombre + 2 },   // Nombre
        { wch: maxDni + 2 },      // DNI
        { wch: 35 },              // Firma
      ]
    : [
        { wch: 5 },               // Nº
        { wch: maxApellido + 2 }, // Apellido
        { wch: maxNombre + 2 },   // Nombre
        { wch: maxDni + 2 },      // DNI
      ];

  ws['!rows'] = [
    { hpt: 26 },  // título
    { hpt: 22 },  // encabezado
    ...filas.map(() => ({ hpt: 20 })),
  ];

  // Título (fila 1)
  ws['A1'].s = TITLE_STYLE;

  // Encabezados (fila 2)
  cols.forEach((col) => { ws[`${col}2`].s = HEADER_STYLE; });

  // Datos (filas 3+)
  for (let r = 3; r <= aoa.length; r++) {
    cols.forEach((col) => {
      if (!ws[`${col}${r}`]) ws[`${col}${r}`] = { t: 's', v: '' };
      ws[`${col}${r}`].s = DATA_STYLE;
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
  XLSX.writeFile(wb, `${titulo.replace(/\s+/g, '_')}.xlsx`);
}
