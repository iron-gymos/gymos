type StatCardProps = {
  label: string;
  value: string;
  note: string;
};

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <article className="card stat-card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}
