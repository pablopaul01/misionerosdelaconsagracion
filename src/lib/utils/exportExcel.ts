// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx-js-style');

interface InscriptoRow {
  apellido: string;
  nombre: string;
  dni?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  estadoCivil?: string | null;
  sacramentos?: string[] | null;
  createdAt?: string | null;
}

export const CAMPOS_LISTA_ASISTENCIA = [
  { id: 'numero', label: 'Nº', width: 5 },
  { id: 'nombre', label: 'Nombre y apellido', width: 32 },
  { id: 'dni', label: 'DNI', width: 14 },
  { id: 'fechaNacimiento', label: 'Fecha de nacimiento', width: 18 },
  { id: 'edad', label: 'Edad', width: 8 },
  { id: 'direccion', label: 'Dirección', width: 28 },
  { id: 'telefono', label: 'Teléfono', width: 16 },
  { id: 'estadoCivil', label: 'Estado civil', width: 16 },
  { id: 'sacramentos', label: 'Sacramentos', width: 34 },
  { id: 'fechaInscripcion', label: 'Fecha de inscripción', width: 20 },
  { id: 'firma', label: 'Firma', width: 35 },
] as const;

export type CampoListaAsistencia = (typeof CAMPOS_LISTA_ASISTENCIA)[number]['id'];

const BORDER = { style: 'thin', color: { rgb: '000000' } };
const CELL_BORDER = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const TITLE_STYLE = {
  font: { bold: true, sz: 13 },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const HEADER_STYLE = {
  font: { bold: true, sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: CELL_BORDER,
};

const DATA_STYLE = {
  alignment: { vertical: 'center' },
  border: CELL_BORDER,
};

function formatFechaNacimientoExcel(fechaNacimiento?: string | null): string {
  if (!fechaNacimiento) return '';

  const [fechaSolo] = fechaNacimiento.split('T');
  const [year, month, day] = fechaSolo.split('-');
  if (!year || !month || !day) return '';

  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.padStart(4, '0')}`;
}

function calcularEdad(fechaNacimiento?: string | null): string {
  if (!fechaNacimiento) return '';

  const [fechaSolo] = fechaNacimiento.split('T');
  const [year, month, day] = fechaSolo.split('-').map(Number);
  if (!year || !month || !day) return '';

  const hoy = new Date();
  let edad = hoy.getFullYear() - year;
  const cumplioAnios = hoy.getMonth() > month - 1 || (hoy.getMonth() === month - 1 && hoy.getDate() >= day);
  if (!cumplioAnios) edad -= 1;

  return edad >= 0 ? String(edad) : '';
}

export function exportarListaAsistencia(
  inscriptos: InscriptoRow[],
  titulo: string,
  tituloVisible: string,
  includeFirma: boolean = true,
  incluirDatosInscriptos: boolean = false,
  camposSeleccionados?: CampoListaAsistencia[],
) {
  const campos = camposSeleccionados ?? (incluirDatosInscriptos
    ? CAMPOS_LISTA_ASISTENCIA.filter(({ id }) => includeFirma || id !== 'firma').map(({ id }) => id)
    : ['numero', 'nombre', 'dni', 'fechaInscripcion', ...(includeFirma ? ['firma'] : [])] as CampoListaAsistencia[]);
  const configuracionCampos = campos.flatMap((campo) => {
    const configuracion = CAMPOS_LISTA_ASISTENCIA.find(({ id }) => id === campo);
    return configuracion ? [configuracion] : [];
  });
  const headers = configuracionCampos.map(({ label }) => label);

  const sortedInscriptos = [...inscriptos].sort((a, b) =>
    a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' }),
  );
  const filas = sortedInscriptos.map((inscripto, index) => {
    const valores: Record<CampoListaAsistencia, string | number> = {
      numero: index + 1,
      nombre: `${inscripto.apellido}, ${inscripto.nombre}`.trim(),
      dni: inscripto.dni ?? '',
      fechaNacimiento: formatFechaNacimientoExcel(inscripto.fechaNacimiento),
      edad: calcularEdad(inscripto.fechaNacimiento),
      direccion: inscripto.direccion ?? '',
      telefono: inscripto.telefono ?? '',
      estadoCivil: inscripto.estadoCivil ?? '',
      sacramentos: (inscripto.sacramentos ?? []).join(', '),
      fechaInscripcion: inscripto.createdAt ? new Date(inscripto.createdAt).toLocaleDateString('es-AR') : '',
      firma: '',
    };
    return campos.map((campo) => valores[campo]);
  });

  const cols = headers.map((_, index) => XLSX.utils.encode_col(index));
  const aoa = [[tituloVisible, ...headers.slice(1).map(() => '')], headers, ...filas];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  ws['!cols'] = configuracionCampos.map(({ width }) => ({ wch: width }));
  ws['!rows'] = [{ hpt: 26 }, { hpt: 22 }, ...filas.map(() => ({ hpt: 20 }))];
  ws.A1.s = TITLE_STYLE;

  cols.forEach((col) => { ws[`${col}2`].s = HEADER_STYLE; });
  for (let row = 3; row <= aoa.length; row++) {
    cols.forEach((col) => {
      if (!ws[`${col}${row}`]) ws[`${col}${row}`] = { t: 's', v: '' };
      ws[`${col}${row}`].s = DATA_STYLE;
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
  XLSX.writeFile(wb, `${titulo.replace(/\s+/g, '_')}.xlsx`);
}
