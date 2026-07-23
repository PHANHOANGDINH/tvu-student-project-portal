import PublicFooter from '../components/PublicFooter'
import PublicHeader from '../components/PublicHeader'

export default function PublicLayout({ children }) {
  return <div className="public-page"><PublicHeader/><main className="public-main">{children}</main><PublicFooter/></div>
}
