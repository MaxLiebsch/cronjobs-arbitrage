export function extractId(url: string) {
  // Split the string by the hyphen and return the last part
  return url.split("-").pop();
}
