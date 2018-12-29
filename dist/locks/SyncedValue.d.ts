import TypedArray from './typed-array.interface';
export default class SyncedValue<T extends TypedArray> {
    protected resource: T;
    protected cellIndex: number;
    constructor(resource: T, cellIndex: number);
    increment(val: number): number;
    incrementOne(): number;
    decrement(val: number): number;
    decrementOne(): number;
    load(): number;
    store(value: number): number;
}
