import { clsx } from 'clsx';

/**
 * cn — gabung className kondisional (project non-shadcn, tanpa tailwind-merge)
 * Pakai clsx saja, cukup untuk array/object/conditional join.
 * Contoh: cn('px-2', isActive && 'bg-eager', { 'opacity-50': disabled })
 */
export function cn(...inputs) {
  return clsx(inputs);
}

export default cn;
