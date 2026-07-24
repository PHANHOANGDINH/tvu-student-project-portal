import path from 'path'
import multer from 'multer'
import { cleanupFiles, ensureUploadRoot, safeStoredName } from '../services/fileStorage.service.js'

const allowed = new Map([
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']],
])
const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try { callback(null, await ensureUploadRoot()) } catch (cause) { callback(cause) }
  },
  filename: (_req, file, callback) => callback(null, safeStoredName(file.originalname)),
})
const raw = multer({
  storage,
  limits: { files: 5, fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(path.basename(file.originalname)).toLowerCase()
    const mime = String(file.mimetype).toLowerCase()
    const accepted = allowed.get(extension)
    callback(accepted?.includes(mime) ? null : Object.assign(
      new Error('Chỉ chấp nhận tệp PDF, DOC hoặc DOCX hợp lệ.'), { statusCode: 400 },
    ), Boolean(accepted?.includes(mime)))
  },
}).single('file')
export function uploadTopicRoundFile(req, _res, next) {
  raw(req, _res, async cause => {
    if (!cause) return next()
    await cleanupFiles(req.file ? [req.file] : [])
    cause.statusCode = cause.code === 'LIMIT_FILE_SIZE' ? 413 : (cause.statusCode || 400)
    next(cause)
  })
}
