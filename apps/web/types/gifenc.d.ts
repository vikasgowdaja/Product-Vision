declare module 'gifenc' {
  export function GIFEncoder(): {
    writeFrame(indexed: Uint8Array, width: number, height: number, options: { palette: number[][]; delay: number; repeat: number }): void;
    finish(): void;
    bytes(): Uint8Array;
  };
  export function quantize(rgba: Uint8Array, colors: number, options?: { format: string }): number[][];
  export function applyPalette(rgba: Uint8Array, palette: number[][], format?: string): Uint8Array;
}