import path from "node:path";
import { readFile } from "node:fs/promises";

const unsafeName = /[\r\n]|%2e%2e(?:%2f|%5c)|[/\\]/i;
const signatures = {
  ".pdf": buffer => buffer.length >= 12
    && buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
    && buffer.subarray(Math.max(0, buffer.length - 1024)).includes(Buffer.from("%%EOF")),
  ".doc": buffer => buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
  ".docx": buffer => buffer.length >= 8
    && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  ".pptx": buffer => buffer.length >= 8
    && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  ".zip": buffer => buffer.length >= 8
    && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])),
  ".rar": buffer => buffer.length >= 8
    && (buffer.subarray(0, 7).equals(Buffer.from("Rar!\x1a\x07\x00", "binary"))
      || buffer.subarray(0, 8).equals(Buffer.from("Rar!\x1a\x07\x01\x00", "binary"))),
  ".png": buffer => buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".jpg": buffer => buffer.length >= 4
    && buffer[0] === 0xff && buffer[1] === 0xd8
    && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9,
  ".jpeg": buffer => buffer.length >= 4
    && buffer[0] === 0xff && buffer[1] === 0xd8
    && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9,
  ".txt": buffer => buffer.length > 0,
};

export function normalizeOriginalName(value) {
  const decoded = Buffer.from(String(value || ""), "latin1").toString("utf8");
  if (!decoded || decoded.length > 260 || unsafeName.test(decoded) || path.basename(decoded) !== decoded) {
    throw Object.assign(new Error("Tên tệp không hợp lệ."), { statusCode: 400 });
  }
  return decoded;
}

export async function validateStoredUpload(file) {
  file.originalname = normalizeOriginalName(file.originalname);
  const extension = path.extname(file.originalname).toLowerCase();
  const validate = signatures[extension];
  if (!validate) return;
  const buffer = await readFile(file.path);
  if (!validate(buffer)) {
    throw Object.assign(new Error("Nội dung tệp không khớp với định dạng đã khai báo."), { statusCode: 400 });
  }
}
