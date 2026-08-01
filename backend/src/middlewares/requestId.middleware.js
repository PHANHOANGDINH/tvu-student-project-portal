import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  const supplied = req.get('x-request-id');
  req.requestId = supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied) ? supplied : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}
