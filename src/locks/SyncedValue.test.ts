import SyncedValue from './SyncedValue';

describe('SyncedValue tests', () => {
    let arr: Int32Array;
    let syncedValue: SyncedValue<typeof arr>;

    beforeEach(() => {
        const buff = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
        arr = new Int32Array(buff);
        syncedValue = new SyncedValue(arr, 0);
    });

    test('basic store of synced value', () => {
        syncedValue.store(15);
        expect(syncedValue.load()).toEqual(15);
    });

    test('increment', () => {
        syncedValue.store(0);
        syncedValue.increment(15);
        syncedValue.increment(2);
        syncedValue.incrementOne();
        expect(syncedValue.load()).toEqual(18);
    });

    test('decrement', () => {
        syncedValue.store(0);
        syncedValue.decrement(15);
        syncedValue.decrement(2);
        syncedValue.decrementOne();
        expect(syncedValue.load()).toEqual(-18);
    });
});
