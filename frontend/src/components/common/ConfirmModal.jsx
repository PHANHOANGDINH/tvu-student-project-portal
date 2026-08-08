import { AlertTriangle, LoaderCircle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmModal({ open, title, description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', loading = false, tone = 'danger', onConfirm, onClose }) {
  return <Modal open={open} title={title} description={description} size="small" onClose={onClose} closeOnBackdrop={!loading} closeOnEscape={!loading}><div className={`modal-icon ${tone}`}><AlertTriangle size={24} /></div><div className="modal-actions"><button className="btn-light" onClick={onClose} disabled={loading}>{cancelLabel}</button><button className={tone === 'danger' ? 'btn-danger' : 'btn-primary small'} onClick={onConfirm} disabled={loading}>{loading && <LoaderCircle className="spin-icon" size={17} />}{loading ? 'Đang xử lý...' : confirmLabel}</button></div></Modal>
}
