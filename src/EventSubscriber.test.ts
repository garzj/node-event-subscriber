import { describe, expect, jest, test } from '@jest/globals';
import { EventMap, EventSubscriber } from './EventSubscriber';
import { EventEmitter } from 'stream';
// @ts-ignore -- optional dependency
import type { TypedEmitter } from 'tiny-typed-emitter';

type Emitter<T extends EventMap<T>> = any extends TypedEmitter
  ? EventEmitter
  : TypedEmitter<T>;

describe('event subscriber', () => {
  // Type check
  type Events = {
    read: (data: string) => void;
    write: (data: string) => boolean;
    close: () => void;
  };
  const typed = new EventSubscriber(new EventEmitter() as Emitter<Events>);
  typed.on('close', () => {});
  typed.on('read', (data) => {});
  typed.on('write', (data) => true);

  const untyped = new EventSubscriber(new EventEmitter());
  untyped.on('definitely-not-garbage', (nice: number) => 420);

  // Funcionality check
  const em = new EventEmitter();
  const sub = new EventSubscriber(em);

  test('proxies arguments', () => {
    const cb = jest.fn();
    sub.on('asdf', cb);
    em.emit('asdf', 1, 2, 3);
    expect(cb).toHaveBeenCalledWith(1, 2, 3);
  });

  test('removes listeners', () => {
    sub.off();
    expect(em.listenerCount('asdf')).toEqual(0);
  });

  test('removes only listeners specified by event', () => {
    em.on('asdf', jest.fn());
    const kept1 = jest.fn();
    const kept2 = jest.fn();
    sub.on('kept', kept1);
    sub.on('kept', kept2);
    sub.on('removed', jest.fn());
    sub.on('removed', jest.fn());
    sub.off('removed');
    em.emit('kept');
    em.emit('kept');
    expect(kept1).toHaveBeenCalledTimes(2);
    expect(kept2).toHaveBeenCalledTimes(2);
    expect(em.listenerCount('removed')).toEqual(0);
    expect(em.listenerCount('kept')).toEqual(2);
  });

  test('calls only once on once', () => {
    const cb = jest.fn();
    sub.once('lol', cb);
    em.emit('lol');
    em.emit('lol');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('removes only epecified listeners on event', () => {
    const l1 = jest.fn();
    const l2 = jest.fn();
    sub.on('event', l1);
    sub.on('event', l2);
    sub.off('event', l2);
    em.emit('event', 6, 7, 8);
    expect(l1).toHaveBeenCalledWith(6, 7, 8);
    expect(l2).not.toHaveBeenCalled();
  });

  test('returns itself', () => {
    sub
      .on('asdf', jest.fn())
      .on('alsdkfh', jest.fn())
      .once('lol', jest.fn())
      .off('alsdkfh')
      .off();
  });
});
