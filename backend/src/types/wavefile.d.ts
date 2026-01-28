declare module 'wavefile' {
    export class WaveFile {
        constructor(data?: any);
        fromBuffer(buffer: Uint8Array): void;
        toBuffer(): Uint8Array;
        toSampleRate(rate: number): void;
    }
}
