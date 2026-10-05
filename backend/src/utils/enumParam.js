/**
 * Validasi query param bertipe enum Prisma.
 *
 * Service sering meneruskan `?status=` mentah ke `where` Prisma. Kolom enum
 * menolak nilai di luar daftar, dan penolakan itu dilempar sebagai
 * PrismaClientValidationError — error tanpa `status`, jadi error handler global
 * membalas 500 untuk permintaan yang sebenarnya salah filter saja.
 *
 * Nilai yang sah diambil dari objek enum hasil generate Prisma, bukan dari daftar
 * manual, jadi tidak bisa melenceng dari schema.prisma.
 *
 * `undefined` berarti "tidak memfilter" — dipakai saat param tidak dikirim, atau
 * dikirim kosong (?status=). Nilai tak dikenal DITOLAK (400), bukan diabaikan:
 * diam-diam mengembalikan daftar tanpa filter membuat pengguna mengira they've
 * memfilter padahal tidak.
 */

import { HttpError } from './httpError.js';

export function parseEnumParam(value, enumFromPrisma, label) {
  if (value === undefined || value === null || value === '') return undefined;

  const allowed = Object.values(enumFromPrisma);
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new HttpError(
      400,
      'INVALID_ENUM_PARAM',
      `${label} harus salah satu dari: ${allowed.join(', ')}`,
    );
  }
  return value;
}

export default parseEnumParam;