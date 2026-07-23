import PublicFooter from '../components/footer/PublicFooter'
import PublicHeader from '../components/PublicHeader'

export default function PublicLayout({ children }) {
  return <div className="public-app public-page"><PublicHeader/><main className="public-main">{children}</main><PublicFooter/></div>
}
