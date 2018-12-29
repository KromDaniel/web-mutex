"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var SyncedValue_1 = __importDefault(require("./SyncedValue"));
describe('SyncedValue tests', function () {
    var arr;
    var syncedValue;
    beforeEach(function () {
        var buff = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
        arr = new Int32Array(buff);
        syncedValue = new SyncedValue_1.default(arr, 0);
    });
    test('basic store of synced value', function () {
        syncedValue.store(15);
        expect(syncedValue.load()).toEqual(15);
    });
    test('increment', function () {
        syncedValue.store(0);
        syncedValue.increment(15);
        syncedValue.increment(2);
        syncedValue.incrementOne();
        expect(syncedValue.load()).toEqual(18);
    });
    test('decrement', function () {
        syncedValue.store(0);
        syncedValue.decrement(15);
        syncedValue.decrement(2);
        syncedValue.decrementOne();
        expect(syncedValue.load()).toEqual(-18);
    });
});
