/** Extrae el mensaje de un error de TanStack Form v1 (puede ser string o StandardSchemaV1.Issue) */
export const fieldError = (error: unknown): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

/** Capitaliza la primera letra de cada palabra y pone el resto en minúsculas */
export const toCapitalize = (str: string): string =>
  str.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
