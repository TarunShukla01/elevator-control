export const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
export const now = () => Date.now();
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
