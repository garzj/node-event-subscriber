# @garzj/event-subscriber

Proxies subscriptions to an EventEmitter and stores references, allowing for an easy removal.

## Features

- TypeScript support
- Compatible with
  - [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
  - [EventEmitter](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter)
  - [typed-emitter](https://github.com/andywer/typed-emitter)
  - [tiny-typed-emitter](https://github.com/binier/tiny-typed-emitter)
  - more...

## Heads up

Due to a TypeScript limitation (there does not seem to be a reliable way to remap return types of function overloads), methods of the `EventSubscriber` class may look like they return the original event emitter (they do not, the subscriber is returned).

It's probably better to avoid chaines like `.on(a, b).on(c, d)` and prefer `sub.on(a, b); sub.on(c, d);` instead.

## Installation

```bash
npm i @garzj/event-subscriber
```

or with yarn

```bash
yarn add @garzj/event-subscriber
```

## Usage

### Subscribe to events

```ts
import { EventEmitter } from 'events';
import { EventSubscriber } from '@garzj/event-subscriber';

const myEmitter = new EventEmitter();

myEmitter.on('my-event', () => console.log('Always called!'));
myEmitter.emit('my-event');

const sub = new EventSubscriber(myEmitter);
sub.on('my-event', () => console.log('Temporarily called!'));
myEmitter.emit('my-event');
sub.off();

myEmitter.emit('my-event');
```

#### Output

```
Always called!
Always called!
Temporarily called!
Always called!
```

### Forward type decleration

```ts
import { EventSubscriber } from '@garzj/event-subscriber';

let subscriber: EventSubscriber<typeof process>;

subscriber = new EventSubscriber(process);
subscriber.on('exit', () => console.log('process exit'));
subscriber.off();
```
