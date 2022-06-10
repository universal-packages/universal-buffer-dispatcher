# Buffer Dispatcher

[![npm version](https://badge.fury.io/js/@universal-packages%2Fbuffer-dispatcher.svg)](https://www.npmjs.com/package/@universal-packages/buffer-dispatcher)
[![Testing](https://github.com/Universal-Packages/universal-buffer-dispatcher/actions/workflows/testing.yml/badge.svg)](https://github.com/Universal-Packages/universal-buffer-dispatcher/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/Universal-Packages/universal-buffer-dispatcher/branch/main/graph/badge.svg?token=CXPJSN8IGL)](https://codecov.io/gh/Universal-Packages/universal-buffer-dispatcher)

With the wonders of asynchronous routines in JavaScript you can achieve more performant and smooth applications, but sometimes you just want to take it easy with all the racing and make sure all you async tasks are still asynchronous from the rest of your application but not from other tasks, for example a task that mutates a state in a particular way, you want to give it a chance of mutating it in all the ways it needs to before another tasks mutastes it from another part of you app.

## Install

```shell
npm install @universal-packages/buffer-dispatcher
```

## BufferDispatcher

It accumulates an array of entries and will call the dispatcher for every single one of them but awaiting before dispatching the next one.

```js
const messages = []

const dispatcher = async (payload) => {
  sleep(payload.timeToWait)
  messages.push(payload.message)
}

const bufferDispatcher = new BufferDispatcher(dispatcher)

bufferDispatcher.append({ message: '1', timeToWait: 3000 })
bufferDispatcher.append({ message: '2', timeToWait: 2000 })
bufferDispatcher.append({ message: '3', timeToWait: 1000 })
bufferDispatcher.append({ message: '4', timeToWait: 0 })

await bufferDispatcher.await()

console.log(messages)
// > ['1', '2', '3', '4']
```

### .clear()

Stopes the buffer dispatcher and clears the rest of the entries to not be despatched anymore.

```js
bufferDispatcher.claer()
```

### .stop()

Stopes the buffer dispatcher and leaves intact the rest of the entries to be processed later.

```js
await bufferDispatcher.stop()
```

### .continue()

In case the buffer dispatcher was stoped, it resumes the dispatching.

### .await()

Returns a promise that will only be resolved once all entries have been dispatched.

```js
await bufferDispatcher.await()
```

### .isBussy()

Returns `true` or `false` depending on if the buffer dispatcher is currently dispatching.

```js
const bussy = bufferDispatcher.isBussy()
```
## Typescript

Time Measurer is developed in TypeScript and shipped fully typed.

## Contributing

Development of Time Measurer happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving Recoil.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
