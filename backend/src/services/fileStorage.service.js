import path from'path';import{randomUUID}from'crypto';import{mkdir,unlink}from'fs/promises';
export const uploadRoot=path.resolve(process.cwd(),'uploads','submissions');
export async function ensureUploadRoot(){await mkdir(uploadRoot,{recursive:true});return uploadRoot}
export function safeStoredName(original=''){return`${randomUUID()}${path.extname(path.basename(original)).toLowerCase()}`}
export function relativeUploadPath(storedName){return path.posix.join('submissions',path.basename(storedName))}
export function resolveStoredFile(relativePath){const full=path.resolve(path.dirname(uploadRoot),relativePath);if(!full.startsWith(`${uploadRoot}${path.sep}`))throw new Error('Đường dẫn file không hợp lệ');return full}
export async function cleanupFiles(files=[]){await Promise.all(files.map(f=>unlink(f.path).catch(()=>null)))}
