export default function MetricCard({ label, value, hint, icon: Icon, tone = 'primary' }) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-icon">{Icon ? <Icon size={18} strokeWidth={2.2} /> : null}</div>
      <div className="metric-copy">
        <p>{label}</p>
        <h3>{value}</h3>
        {hint ? <span>{hint}</span> : null}
      </div>
    </article>
  );
}
