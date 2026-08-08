export default function StatCard({ icon: Icon, label, value, description, tone = 'primary' }) {
  return <article className="stat-card-ui"><div className={`stat-icon ${tone}`}>{Icon && <Icon size={22} />}</div><div><span>{label}</span><strong>{value ?? 0}</strong>{description && <p>{description}</p>}</div></article>
}
