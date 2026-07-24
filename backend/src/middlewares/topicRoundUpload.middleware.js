import path from 'path'
import multer from 'multer'
import { open } from 'fs/promises'
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
    if (!cause && req.file) {
      const extension = path.extname(path.basename(req.file.originalname)).toLowerCase()
      const handle = await open(req.file.path, 'r')
      const signature = Buffer.alloc(8)
      try { await handle.read(signature, 0, signature.length, 0) } finally { await handle.close() }
      const valid = extension === '.pdf'
        ? signature.subarray(0, 5).equals(Buffer.from('%PDF-'))
        : extension === '.docx'
          ? signature.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
          : signature.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
      if (!valid) {
        await cleanupFiles([req.file])
        return next(Object.assign(new Error('Nội dung tệp không khớp với định dạng PDF, DOC hoặc DOCX.'), { statusCode: 400 }))
      }
      return next()
    }
    if (!cause) return next()
    await cleanupFiles(req.file ? [req.file] : [])
    cause.statusCode = cause.code === 'LIMIT_FILE_SIZE' ? 413 : (cause.statusCode || 400)
    next(cause)
  })
}
