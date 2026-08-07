import { useId } from 'react'
export default function TvuBrandMark({ size=44,className='',showText=false,inverse=false }){
 const gradientId=`tvu-mark-${useId().replace(/:/g,'')}`
 return <span className={`tvu-brand-lockup ${inverse?'inverse':''} ${className}`.trim()}>
  <svg className="tvu-brand-mark" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="TVU">
   <defs><linearGradient id={gradientId} x1="8" y1="5" x2="55" y2="59" gradientUnits="userSpaceOnUse"><stop stopColor="#1685D1"/><stop offset="1" stopColor="#073B88"/></linearGradient></defs>
   <path fill={`url(#${gradientId})`} d="M32 2 58 12v18c0 15.8-9.6 26.5-26 32C15.6 56.5 6 45.8 6 30V12L32 2Z"/>
   <path fill="none" stroke="#fff" strokeOpacity=".38" strokeWidth="2" d="M32 7.5 53 15v15c0 12.4-7.1 21.3-21 26.5C18.1 51.3 11 42.4 11 30V15l21-7.5Z"/>
   <text x="32" y="37" fill="#fff" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800" textAnchor="middle">TVU</text>
  </svg>
  {showText&&<span className="tvu-brand-copy"><strong>TVU Project Portal</strong><small>Cổng quản lý đồ án sinh viên</small></span>}
 </span>
}
