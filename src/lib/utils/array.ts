
export function isEquals<T extends number>(a: T[] | undefined, b: T[] | undefined, tolerance: number = 1e-5): boolean {
  if (!a || !b) {
    return false;
  }
  return [0, 1].every((_, i) => (Math.abs(a[i] - b[i]) < tolerance))
}
