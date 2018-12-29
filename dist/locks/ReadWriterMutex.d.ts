import Mutex from './Mutex';
import NotifiedValue from './NotifiedValue';
export default class ReadWriterMutex {
    protected readMutex: Mutex;
    protected writeMutex: Mutex;
    protected syncedReadersCount: NotifiedValue;
    protected syncedWritersCount: NotifiedValue;
    constructor(readMutex: Mutex, writeMutex: Mutex, syncedReadersCount: NotifiedValue, syncedWritersCount: NotifiedValue);
    readLock(): void;
    readUnlock(): void;
    writeLock(): void;
    writeUnlock(): void;
}
