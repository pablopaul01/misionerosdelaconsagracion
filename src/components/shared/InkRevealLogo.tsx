'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// ── Polígono de 12 puntos que simula un manchón de tinta ──────────────────────
// Cada punto está a una distancia DISTINTA del centro (50%,50%), lo que crea
// los bordes irregulares orgánicos de la tinta al expandirse.
//
// DOT → todos los puntos colapsados en el centro (la "gota")
// BLOB → puntos radiando a diferentes distancias (el manchón expandido)
// ─────────────────────────────────────────────────────────────────────────────

const pt = (angle: number, r: number) => {
  const rad = (angle * Math.PI) / 180;
  return `${Math.round(50 + r * Math.cos(rad))}% ${Math.round(50 + r * Math.sin(rad))}%`;
};

// 12 puntos cada 30°, con radios muy variables para bordes irregulares
const RADII_MID  = [64, 52, 70, 56, 66, 50, 75, 53, 68, 51, 72, 55];
const RADII_BLOB = [100, 78, 118, 82, 108, 75, 122, 80, 112, 77, 120, 84];
const ANGLES     = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const poly = (radii: number[]) =>
  `polygon(${ANGLES.map((a, i) => pt(a, radii[i])).join(', ')})`;

const INK_DOT  = `polygon(${ANGLES.map(() => '50% 50%').join(', ')})`;
const INK_MID  = poly(RADII_MID);
const INK_BLOB = poly(RADII_BLOB);

export const InkRevealLogo = () => (
  <div className="flex flex-col items-center gap-6">
    <motion.div
      className="relative w-72 h-72 sm:w-96 sm:h-96"
      initial={{ clipPath: INK_DOT }}
      animate={{ clipPath: [INK_DOT, INK_MID, INK_BLOB] }}
      transition={{
        duration: 1.9,
        times: [0, 0.52, 1],
        ease: ['easeIn', [0.05, 0.5, 0.2, 1]],
      }}
    >
      <Image
        src="/logomisioneros.png"
        alt="Misioneros de la Consagración"
        fill
        className="object-contain"
        priority
      />
    </motion.div>

    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
      className="font-title text-brand-brown text-lg tracking-widest uppercase text-center"
    >
      Misioneros de la Consagración
    </motion.p>
  </div>
);
