const TVU_LOGO_PATH = '/assets/logo-dai-hoc-tra-vinh.png'

export default function TvuBrandMark({ size = 44, className = '', showText = false, inverse = false }) {
  return (
    <span className={`tvu-brand-lockup ${inverse ? 'inverse' : ''} ${className}`.trim()}>
      <img
        className="tvu-brand-mark"
        src={TVU_LOGO_PATH}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        alt="Logo Đại học Trà Vinh"
      />
      {showText && (
        <span className="tvu-brand-copy">
          <strong>TVU Project Portal</strong>
          <small>Cổng quản lý đồ án sinh viên</small>
        </span>
      )}
    </span>
  )
}
