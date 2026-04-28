/**
 * @royea/flush-queue — client-side event buffer with batch POST, retry, and optional offline persist.
 */
export type QueueEvent = {
    id?: string;
    type: string;
    payload?: Record<string, unknown>;
    timestamp?: number;
};
export type StorageAdapter = {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
};
export type FlushQueueConfig = {
    endpoint: string;
    batchSize?: number;
    flushIntervalMs?: number;
    storageKey?: string;
    storage?: StorageAdapter;
};
type FlushQueueInstance = {
    push(event: QueueEvent): void;
    flush(): Promise<void>;
    start(): void;
    stop(): void;
};
export declare function createFlushQueue(config: FlushQueueConfig): FlushQueueInstance;
export {};
