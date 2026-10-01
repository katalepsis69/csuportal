// ponytail: one campus timezone (Manila, no DST), hardcoded. Add config only
// if the university ever relocates.
const TZ = 'Asia/Manila';

export function manilaDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH', { timeZone: TZ });
}

export function manilaDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-PH', {
    timeZone: TZ,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
