export function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return null;
  }
}
