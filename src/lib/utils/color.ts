
export function hashColor(n: number | string | undefined) {
  if (!n) {
    throw new Error();
  }
  if (typeof n === "string") {
    n = Array.from(n).reduce((prev, curr) => prev + curr.charCodeAt(0) , 0)
  }

  const r = (n * 2344242424) % 256;
  const g = (n * 4325049242) % 256;
  const b = (n * 1103242982) % 256;

  //construct the bits. 8 bit per value (3 values) for a total of 24 bits
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  
}
