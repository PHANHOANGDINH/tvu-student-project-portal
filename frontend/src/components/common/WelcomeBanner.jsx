import { Sparkles } from 'lucide-react'

export default function WelcomeBanner({ title, description, eyebrow = 'TVU Student Project Portal', actions }) {
  return <section className="welcome-banner"><div className="welcome-copy"><span><Sparkles size={15} /> {eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{actions && <div className="welcome-actions">{actions}</div>}<div className="welcome-mark" aria-hidden="true">TVU</div></section>
}
