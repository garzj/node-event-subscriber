# node-event-subscriber

Proxies subscriptions to an EventEmitter and stores references, allowing for an easy removal.

## Features

- TypeScript support
- Compatible with [tiny-typed-emitter](https://github.com/binier/tiny-typed-emitter)

## Installation

```bash
npm i event-subscriber
```

## Usage

```ts
import { EventEmitter } from 'events';
import { EventSubscriber } from 'event-subscriber';

const myEmitter = new EventEmitter();

myEmitter.on('my-event', () => console.log('Always called!'));
myEmitter.emit('my-event');

const sub = new EventSubscriber(myEmitter);
sub.on('my-event', () => console.log('Temporarily called!'));
myEmitter.emit('my-event');
sub.off();

myEmitter.emit('my-event');
```

## Output

```
Always called!
Always called!
Temporarily called!
Always called!
```
