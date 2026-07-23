import PublicFooter from '../components/footer/PublicFooter'
import PublicHeader from '../components/PublicHeader'

export default function AuthLayout({ children }) {
  return <div className="public-app login-page"><PublicHeader compact/>{children}<PublicFooter/></div>
}
