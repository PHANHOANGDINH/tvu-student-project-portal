import { useEffect, useRef } from 'react'
import { AlertTriangle, LoaderCircle, X } from 'lucide-react'

function ConfirmModal({ open, title, description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', loading = false, tone = 'danger', onConfirm, onClose }) {
  const cancelRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    cancelRef.current?.focus()
    function handleKeyDown(event) { if (event.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, loading, onClose])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose() }}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><button className="modal-close" aria-label="Đóng" onClick={onClose} disabled={loading}><X size={19} /></button><div className={`modal-icon ${tone}`}><AlertTriangle size={24} /></div><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p><div className="modal-actions"><button ref={cancelRef} className="btn-light" onClick={onClose} disabled={loading}>{cancelLabel}</button><button className={tone === 'danger' ? 'btn-danger' : 'btn-primary small'} onClick={onConfirm} disabled={loading}>{loading && <LoaderCircle className="spin-icon" size={17} />}{loading ? 'Đang xử lý...' : confirmLabel}</button></div></section></div>
}
export default ConfirmModal
