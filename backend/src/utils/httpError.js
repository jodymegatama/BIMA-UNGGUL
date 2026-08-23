/**
 * HttpError — BIMA UNGGUL Phase 3
 * Error dengan HTTP status + code, dilempar dari service layer.
 * Express 5 otomatis meneruskan rejected promise ke error handler global.
 */

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export default HttpError;
