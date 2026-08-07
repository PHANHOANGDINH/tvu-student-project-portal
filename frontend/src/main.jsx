import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { ProConfigProvider } from '@ant-design/pro-components'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx'

const theme = {
  token: {
    colorPrimary: '#164A9C', colorPrimaryHover: '#245DB5', colorPrimaryActive: '#103A7D',
    colorBgLayout: '#F4F6FB', colorBgContainer: '#FFFFFF', colorText: '#172B4D',
    colorTextSecondary: '#6B778C', colorBorder: '#E7EAF0', borderRadius: 12,
    borderRadiusLG: 16, controlHeight: 40, controlHeightLG: 46,
    fontFamily: '"Be Vietnam Pro", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={theme} locale={{ locale: 'vi-vn' }}>
      <ProConfigProvider hashed={false}><AppErrorBoundary><App /></AppErrorBoundary></ProConfigProvider>
    </ConfigProvider>
  </StrictMode>,
)
