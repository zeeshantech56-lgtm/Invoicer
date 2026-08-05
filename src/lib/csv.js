export function sanitizeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Prevent CSV injection by escaping fields starting with =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}
