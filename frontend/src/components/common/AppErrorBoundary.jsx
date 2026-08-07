import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('UI component error', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="app-fatal-state" role="alert">
      <h1>Không thể hiển thị nội dung này.</h1>
      <p>Một thành phần của trang gặp sự cố. Vui lòng thử tải lại.</p>
      <div className="modal-actions">
        <button className="btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button>
        <button className="btn-light" onClick={() => window.history.back()}>Quay lại</button>
      </div>
    </main>
  }
}
