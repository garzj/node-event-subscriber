type Subscription = {
  count: number;
  proxy: AnyFunc;
};

type Subs = Map<AnyFunc, Subscription>;

type EventSubs = Map<keyof any, Subs>;

type AnyFunc = (...args: any[]) => any;

type EditListener = (event: any, listener: AnyFunc) => any;

interface GenericEmitterO {
  on: EditListener;
  off: EditListener;
}
interface GenericEmitterEL {
  addEventListener: EditListener;
  removeEventListener: EditListener;
}
interface GenericEmitterOnce {
  once: EditListener;
}

type GenericEmitter = GenericEmitterO | GenericEmitterEL | GenericEmitterOnce;

type AddListener<E extends GenericEmitter> = E extends GenericEmitterEL
  ? E['addEventListener']
  : E extends GenericEmitterO
    ? E['on']
    : never;

type OnceListener<E extends GenericEmitter> = E extends GenericEmitterOnce
  ? E['once']
  : AddListener<E>;

type RemoveListener<E extends GenericEmitter> = E extends GenericEmitterEL
  ? E['removeEventListener']
  : E extends GenericEmitterO
    ? E['off']
    : never;

export class EventSubscriber<E extends GenericEmitter> {
  private eventSubs: EventSubs = new Map();

  constructor(readonly emitter: E) {}

  on: AddListener<E> = ((event, listener) => {
    const proxy = listener;
    this.incSub(event, listener, proxy);
    return this;
  }) satisfies GenericEmitterO['on'] as any;

  once: OnceListener<E> = ((event: keyof any, listener: AnyFunc) => {
    const proxy = (...args: any[]) => {
      this.decSub(event, listener);
      return listener(args);
    };
    this.incSub(event, listener, proxy);
    return this;
  }) satisfies GenericEmitterO['on'] as any;

  off: RemoveListener<E> & {
    (event: Parameters<RemoveListener<E>>[0]): E;
    (): E;
  } = ((event?: keyof any, listener?: AnyFunc) => {
    if (event !== undefined && !this.eventSubs.has(event)) return this;
    const subsEntries: [keyof any, Subs | undefined][] = event
      ? [[event, this.eventSubs.get(event)]]
      : [...this.eventSubs.entries()];

    for (const [event, subs] of subsEntries) {
      if (!subs) continue;

      let subEntries: [AnyFunc, Subscription | undefined][] = listener
        ? [[listener, subs.get(listener)]]
        : [...subs.entries()];

      for (const [l, _] of subEntries) {
        this.decSub(event, l);
      }
    }

    return this;
  }) satisfies GenericEmitterO['off'] as any;

  // proxy is cached for multiple subs on the same event & listener
  private incSub(event: keyof any, listener: AnyFunc, proxy: AnyFunc) {
    const subs: Subs = this.eventSubs.get(event) ?? new Map();
    const sub = subs.get(listener) ?? { count: 0, proxy };
    sub.count++;
    subs.set(listener, sub);
    this.eventSubs.set(event, subs);

    const e = this.emitter as any;
    if (e.addEventListener) {
      (this.emitter as GenericEmitterEL).addEventListener(event, sub.proxy);
    } else if (e.on) {
      (this.emitter as GenericEmitterO).on(event, sub.proxy);
    }
  }

  private decSub(event: keyof any, listener: AnyFunc) {
    const subs = this.eventSubs.get(event);
    if (!subs) return;
    const sub = subs.get(listener);
    if (!sub) return;
    if (--sub.count <= 0) {
      subs.delete(listener);
    }

    const e = this.emitter as any;
    if (e.removeEventListener) {
      (this.emitter as GenericEmitterEL).removeEventListener(event, sub.proxy);
    } else if (e.off) {
      (this.emitter as GenericEmitterO).off(event, sub.proxy);
    }
  }
}
