declare module 'jsqr' {
  export interface QRCode {
    binaryData: Uint8ClampedArray;
    data: string;
    chunks?: any[];
    version?: number;
    location?: any;
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): QRCode | null;
}
