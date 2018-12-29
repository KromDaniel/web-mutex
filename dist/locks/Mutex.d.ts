import NotifiedValue from './NotifiedValue';
import SyncedValue from './SyncedValue';
import TypedArray from './typed-array.interface';
export default class Mutex {
    syncedNotifier: NotifiedValue;
    static once<T extends TypedArray>(mutex: Mutex, resource: SyncedValue<T>, onceFN: (done: () => void) => void): void;
    private lockAcquired;
    constructor(syncedNotifier: NotifiedValue);
    lock(): void;
    asyncLock(interval: number | undefined, cb: () => void): Promise<void> | undefined;
    unlock(): void;
    runPromiseInLock<T>(p: Promise<T>): Promise<T>;
    private _throwIfLocked;
    private _asyncLock;
}
