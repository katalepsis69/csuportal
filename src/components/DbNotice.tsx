export function DbNotice({ detail }: { detail?: string | null }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <p className="font-semibold text-foreground">Cannot read evaluation data</p>
      <p className="text-xs text-muted-foreground mt-1">
        The database did not answer this request. A paused Supabase free project (one week idle)
        looks exactly like this — wake it from the dashboard, then reload.
        {detail ? ` (${detail})` : ''}
      </p>
    </div>
  );
}
