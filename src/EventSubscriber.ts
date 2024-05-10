import EventEmitter = require('events');
// @ts-ignore -- optional dependency
import type { TypedEmitter } from 'tiny-typed-emitter';

type AnyFunc = (...args: any[]) => any;

export type EventMap<E> = {
  [k in keyof E]: AnyFunc;
};

export type DefaultEventMap = {
  [k: string | symbol]: AnyFunc;
};

// optional dependency: tiny-typed-emitter
type Emitter<T extends DefaultEventMap> = any extends TypedEmitter
  ? EventEmitter
  : TypedEmitter<T> | EventEmitter;

type Subscription<F extends AnyFunc> = {
  count: number;
  proxy: F;
};

type Subs<L extends EventMap<L>, E extends keyof L> = Map<
  L[E],
  Subscription<L[E]>
>;

type EventSubs<L extends EventMap<L>> = Map<keyof L, Subs<L, keyof L>>;

export class EventSubscriber<L extends EventMap<L> = DefaultEventMap> {
  private eventSubs: EventSubs<L> = new Map();

  constructor(public emitter: Emitter<L>) {}

  on<E extends keyof L>(event: E, listener: L[E]): this {
    const proxy = listener;
    this.incSub(event, listener, proxy);
    return this;
  }

  once<E extends keyof L>(event: E, listener: L[E]): this {
    const proxy = ((...args: any[]) => {
      this.decSub(event, listener);
      return listener(args);
    }) as any;
    this.incSub(event, listener, proxy);
    return this;
  }

  off<E extends keyof L>(event?: E, listener?: L[E]): this {
    if (event !== undefined && !this.eventSubs.has(event)) return this;
    const subsEntries: [keyof L, Subs<L, keyof L> | undefined][] = event
      ? [[event, this.eventSubs.get(event)]]
      : [...this.eventSubs.entries()];

    for (const [event, subs] of subsEntries) {
      if (!subs) continue;

      let subEntries: [L[keyof L], Subscription<L[keyof L]> | undefined][] =
        listener ? [[listener, subs.get(listener)]] : [...subs.entries()];

      for (const [l, _] of subEntries) {
        this.decSub(event, l);
      }
    }

    return this;
  }

  // proxy is cached for multiple subs on the same event & listener
  private incSub<E extends keyof L>(event: E, listener: L[E], proxy: L[E]) {
    const subs: Subs<L, E> = this.eventSubs.get(event) ?? new Map();
    const sub = subs.get(listener) ?? { count: 0, proxy };
    sub.count++;
    subs.set(listener, sub);
    this.eventSubs.set(event, subs);

    (this.emitter.on as any)(event, sub.proxy);
  }

  private decSub<E extends keyof L>(event: E, listener: L[E]) {
    const subs = this.eventSubs.get(event);
    if (!subs) return;
    const sub = subs.get(listener);
    if (!sub) return;
    if (--sub.count <= 0) {
      subs.delete(listener);
    }

    (this.emitter.off as any)(event, sub.proxy);
  }
}
