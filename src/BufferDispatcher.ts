import { EventEmitter } from '@universal-packages/event-emitter'
import { startMeasurement } from '@universal-packages/time-measurer'

import { BufferDispatcherOptions } from './BufferDispatcher.types'

export default class BufferDispatcher<T> extends EventEmitter {
  public readonly options: BufferDispatcherOptions<T>

  public get busy(): boolean {
    return this.internalBusy
  }

  private internalBusy = false
  private buffer: T[] = []
  private stopping = false

  public constructor(options: BufferDispatcherOptions<T>) {
    super()
    this.options = { onError: 'continue', ...options }
  }

  public push(entry: T): void {
    this.buffer.push(entry)

    this.emit('push', { payload: { entry } })

    this.continue()
  }

  public continue(): void {
    if (!this.internalBusy) {
      this.emit('resuming')

      this.internalBusy = true
      this.dispatchBuffer()
    }
  }

  public async clear(): Promise<void> {
    if (this.internalBusy) {
      this.buffer = []

      this.emit('cleared')

      return this.stop()
    }
  }

  public async stop(): Promise<void> {
    if (this.internalBusy) {
      this.stopping = true

      this.emit('stopping')

      await this.waitFor('idle')
    }
  }

  private async dispatchBuffer(): Promise<void> {
    while (true) {
      if (this.stopping) {
        this.stopping = false
        this.internalBusy = false

        if (this.buffer.length > 0) {
          this.emit('stopped')
        } else {
          this.emit('finished')
        }
        this.emit('idle')

        break
      }

      const next = this.buffer.shift()
      const measurer = startMeasurement()

      this.emit('dispatching', { payload: { entry: next } })

      try {
        await this.options.entryDispatcher(next)

        this.emit('dispatched', { measurement: measurer.finish(), payload: { entry: next } })
      } catch (error) {
        this.emit('error', { error, measurement: measurer.finish(), payload: { entry: next } })

        switch (this.options.onError) {
          case 'continue':
            break
          case 'stop':
            this.stop()
            break
          case 'clear':
            this.clear()
            break
        }
      }

      if (this.buffer.length === 0) {
        this.internalBusy = false
        this.stopping = false

        this.emit('finished')
        this.emit('idle')
        break
      }
    }
  }
}
