import { clearAuth } from '../utils/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const statusMessages = { 400:'Dữ liệu gửi lên chưa hợp lệ.', 401:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 403:'Bạn không có quyền thực hiện thao tác này.', 404:'Không tìm thấy dữ liệu được yêu cầu.', 409:'Dữ liệu đã tồn tại hoặc đang được sử dụng.', 500:'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.' }
export function buildApiUrl(path){const normalizedPath=path.startsWith('/')?path:`/${path}`;if(API_BASE_URL.endsWith('/api')&&normalizedPath.startsWith('/api/'))return `${API_BASE_URL}${normalizedPath.slice(4)}`;return `${API_BASE_URL}${normalizedPath}`}
export async function request(path,options={}){
 const token=localStorage.getItem('access_token'),headers={Accept:'application/json',...(options.body&&!(options.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`
 let response
 try{response=await fetch(buildApiUrl(path),{...options,headers})}catch{const error=new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.');error.status=0;throw error}
 const data=await response.json().catch(()=>null)
 if(response.status===401&&!path.includes('/auth/login')){clearAuth();if(window.location.pathname!=='/login')window.location.assign('/login')}
 if(!response.ok){const serverMessage=data?.message||data?.error;const technical=!serverMessage||/failed to fetch|network|fetch|sql|exception|stack|api:/i.test(serverMessage);const error=new Error(technical?(statusMessages[response.status]||'Không thể hoàn tất yêu cầu. Vui lòng thử lại.'):serverMessage);error.status=response.status;error.errors=data?.errors||null;throw error}
 return data
}
