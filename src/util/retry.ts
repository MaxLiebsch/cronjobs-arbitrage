

// Define the retry function
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || !(error instanceof Error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries reached");
}
