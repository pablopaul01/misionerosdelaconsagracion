export const MISIONEROS_IMAGEN_VISUALIZACION = {
  avatarGrande: 'avatar_grande',
  bannerReal: 'banner_real',
} as const;

export type MisionerosImagenVisualizacion =
  typeof MISIONEROS_IMAGEN_VISUALIZACION[keyof typeof MISIONEROS_IMAGEN_VISUALIZACION];

export const DEFAULT_MISIONEROS_IMAGEN_VISUALIZACION = MISIONEROS_IMAGEN_VISUALIZACION.avatarGrande;

export const CONFIGURACION_ID = '00000000-0000-0000-0000-000000000001';
