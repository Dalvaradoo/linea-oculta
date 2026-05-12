export function decimalToImplied(odds: number): number {
  if (odds <= 0) throw new Error(`Invalid odds: ${odds}`);
  return 1 / odds;
}
