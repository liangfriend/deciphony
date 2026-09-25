import { ToneColor } from './types';
export declare let _audioContext: AudioContext | null;
export declare function startJPlayer(context?: AudioContext | null): void;
export declare function closeJPlayer(): void;
export declare function activeContext(): Promise<void>;
export declare function getGlobalToneBuffer(cacheKey: string): AudioBuffer | undefined;
export declare function addGlobalToneColor(name: string, toneColor: ToneColor): Promise<void>;
export declare function clearGlobalToneBufferCache(): void;
