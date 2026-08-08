import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ open, title, description, eyebrow, onClose, closeOnBackdrop = true, closeOnEscape = true, size = 'large', children }) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const closeOnEscapeRef = useRef(closeOnEscape)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { closeOnEscapeRef.current = closeOnEscape }, [closeOnEscape])

  useEffect(() => {
    if (!open) return undefined
    returnFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const firstField = panelRef.current?.querySelector('.modal-body input:not([disabled]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled])')
        || panelRef.current?.querySelector('.modal-body button:not([disabled]), .modal-close:not([disabled])')
      firstField?.focus()
    }, 0)
    const handleKeyDown = event => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) onCloseRef.current()
      if (event.key === 'Tab') {
        const focusable=[...panelRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')||[]]
        if(!focusable.length)return
        const first=focusable[0],last=focusable.at(-1)
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="modal-overlay" role="presentation" onMouseDown={event => { if (closeOnBackdrop && event.target === event.currentTarget) onClose() }}>
      <section ref={panelRef} className={`modal-card modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onMouseDown={event => event.stopPropagation()}>
        <header className="modal-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="modal-close" aria-label="Đóng hộp thoại" onClick={onClose}><X size={20} /></button></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>,
    document.body
  )
}
