export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return <div className="page-title page-header-ui"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}{children}</div>{actions && <div className="toolbar-actions">{actions}</div>}</div>
}
