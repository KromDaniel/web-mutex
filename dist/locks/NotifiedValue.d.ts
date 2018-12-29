import SyncedValue from './SyncedValue';
declare class NotifiedValue extends SyncedValue<Int32Array> {
    notify(count?: number): number;
    wait(value: number, timeout?: number): "ok" | "not-equal" | "timed-out";
    waitEqual(value: number): void;
    waitEqualZero(): void;
}
export default NotifiedValue;
