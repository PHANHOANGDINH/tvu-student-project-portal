import AuthFooter from '../components/AuthFooter'
import PublicHeader from '../components/PublicHeader'

export default function AuthLayout({ children }) {
  return <div className="login-page"><PublicHeader compact/>{children}<AuthFooter/></div>
}
