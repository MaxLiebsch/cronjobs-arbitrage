export const subDateDaysISO = (days: number) => new Date(Date.now() - 1000 * 60 * 60 * 24 * days).toISOString();

