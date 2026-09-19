'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Semester } from '@/lib/types';

export function SemesterSelect({
  semesters,
  currentId,
  paramName = 'sem',
}: {
  semesters: Semester[];
  currentId?: string | null;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(newVal: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newVal) {
      params.set(paramName, newVal);
    } else {
      params.delete(paramName);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Filter evaluation semester"
        className="appearance-none rounded-xl border border-border bg-card px-3.5 py-2 pr-8 text-xs font-medium text-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs min-h-[38px] transition-colors"
      >
        <option value="">Current semester</option>
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.academic_year} {s.term}
            {s.is_current ? ' (Current)' : ' (Archive)'}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
