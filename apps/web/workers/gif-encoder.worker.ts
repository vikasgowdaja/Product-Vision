import { GIFEncoder, applyPalette, quantize } from 'gifenc';

type EncoderMessage =
  | { type: 'start'; width: number; height: number; colors: number; repeat: number; palette: ArrayBuffer; color: string }
  | { type: 'frame'; rgba: ArrayBuffer; delay: number }
  | { type: 'finish' };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<EncoderMessage>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};
let encoder: ReturnType<typeof GIFEncoder> | null = null;
let palette: number[][] = [];
let width = 0;
let height = 0;
let repeat = 0;

scope.onmessage = event => {
  try {
    const message = event.data;
    if (message.type === 'start') {
      width = message.width;
      height = message.height;
      repeat = message.repeat;
      encoder = GIFEncoder();
      palette = quantize(new Uint8Array(message.palette), message.colors, { format: 'rgb565' });
      const color = message.color.replace('#', '');
      if (palette.length >= message.colors) palette.pop();
      palette.push([0, 2, 4].map(offset => parseInt(color.slice(offset, offset + 2), 16)));
      scope.postMessage({ type: 'ready' });
    } else if (message.type === 'frame') {
      if (!encoder) throw new Error('GIF encoder has not started.');
      const indexed = applyPalette(new Uint8Array(message.rgba), palette, 'rgb565');
      encoder.writeFrame(indexed, width, height, { palette, delay: message.delay, repeat });
      scope.postMessage({ type: 'frame' });
    } else {
      if (!encoder) throw new Error('GIF encoder has not started.');
      encoder.finish();
      const bytes = new Uint8Array(encoder.bytes());
      scope.postMessage({ type: 'done', bytes: bytes.buffer }, [bytes.buffer]);
      encoder = null;
    }
  } catch (error) {
    scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'GIF encoding failed.' });
  }
};