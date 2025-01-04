import { describe, expect, jest, test } from '@jest/globals';
import { EventSubscriber } from './EventSubscriber';
import { EventEmitter } from 'stream';
import { type TypedEmitter as TinyTypedEmitter } from 'tiny-typed-emitter';
import type TypedEmitter from 'typed-emitter';

type NotAny<T> = 0 extends 1 & T ? never : T;

describe('event subscriber', () => {
  // Type check
  type Events = {
    read: (data: string) => void;
    write: (data: string) => boolean;
    progress: (percentage: number) => string;
    close: () => void;
  };

  const typed = new EventSubscriber(
    new EventEmitter() as TinyTypedEmitter<Events>
  );
  typed.on('close', () => {});
  typed.on('read', (data) => {
    data satisfies NotAny<typeof data>;
  });
  typed.on('write', (data) => {
    data satisfies string;
    return true;
  });
  typed.on('progress', (percentage) => {
    percentage satisfies number;
    return `${percentage}%`;
  });
  typed.off('write');
  typed.off();

  const l1 = (data: string) => {};
  const l2 = (percentage: number) => `${percentage}%`;
  typed.on('read', l1);
  typed.on('progress', l2);
  // @ts-expect-error
  typed.off('read', l2);
  // @ts-expect-error
  typed.off('progress', l1);
  typed.off('read', l1);
  typed.off('progress', l2);

  const typed2 = new EventSubscriber(
    new EventEmitter() as TypedEmitter<Events>
  );
  typed2.on('close', () => {});
  typed2.on('read', (data) => {
    data satisfies NotAny<typeof data>;
  });
  typed2.on('write', (data) => true);

  interface X extends TypedEmitter<Events> {}
  const typed3 = new EventSubscriber(new EventEmitter() as X);
  typed3.on('read', (msg) => {
    msg satisfies NotAny<typeof msg>;
  });

  const untyped = new EventSubscriber(new EventEmitter());
  untyped.on('untyped-something', (nice: number) => 420);

  const untyped2 = new EventSubscriber(new EventEmitter());
  untyped2.on('untyped-any', (nice) => {
    // @ts-expect-error
    nice satisfies NotAny<typeof nice>;
  });

  // Foreward type decleration
  let subscriber: EventSubscriber<typeof process>;

  subscriber = new EventSubscriber(process);
  subscriber.on('exit', () => console.log('process exit'));
  subscriber.off();

  // Functionality check
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
    (sub as any)
      .on('asdf', jest.fn())
      .on('alsdkfh', jest.fn())
      .once('lol', jest.fn())
      .off('alsdkfh')
      .off();
  });

  test('does not effect other subscriptions', () => {
    const subFn = jest.fn();
    const otherFn = jest.fn();
    sub.on('test', subFn);
    sub.emitter.on('test', otherFn);
    sub.off();
    sub.emitter.emit('test');
    expect(subFn).not.toHaveBeenCalled();
    expect(otherFn).toHaveBeenCalledTimes(1);
  });
});
