export function validatePassword(password) {
  const errors = [];

  if (!password) errors.push('Mật khẩu không được để trống.');
  if (password && password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự.');
  if (password && !/[A-Z]/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ hoa.');
  if (password && !/[a-z]/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ thường.');
  if (password && !/\d/.test(password)) errors.push('Mật khẩu phải có ít nhất một chữ số.');

  return errors;
}
