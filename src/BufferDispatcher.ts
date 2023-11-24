import { EventEmitter } from '@universal-packages/event-emitter'
import { startMeasurement } from '@universal-packages/time-measurer'

import { BufferDispatcherOptions } from './BufferDispatcher.types'

/**
 *
 * It accumulates an array of entries and will call the dispatcher for
 * every single one of them but awaiting before dispatching the next one
 *
 */
export default class BufferDispatcher<T> extends EventEmitter {
  public readonly options: BufferDispatcherOptions<T>

  public get await(): Promise<void> {
    return this.dispatchPromise
  }

  public get busy(): boolean {
    return this.internalBusy
  }

  private internalBusy = false
  private buffer: T[] = []
  private dispatchPromise: Promise<void>
  private stopping = false

  public constructor(options: BufferDispatcherOptions<T>) {
    super()
    this.options = { onError: 'continue', ...options }
  }

  /** Adds a new entry to the buffer and starts dispatching if not already active */
  public push(entry: T): void {
    this.buffer.push(entry)

    this.emit('push', { payload: { entry } })

    this.continue()
  }

  /** Starts dispatching again in case it was stopped */
  public continue(): void {
    if (!this.internalBusy) {
      this.emit('resuming')

      this.internalBusy = true
      this.dispatchPromise = this.dispatchBuffer()
    }
  }

  /** Clears the current buffer */
  public async clear(): Promise<void> {
    if (this.internalBusy) {
      this.buffer = []

      this.emit('cleared')

      return this.stop()
    }
  }

  /** Stops dispatching */
  public async stop(): Promise<void> {
    if (this.internalBusy) {
      this.stopping = true

      this.emit('stopping')

      return await this.dispatchPromise
    }
  }

  /** Loops and awaits the callback function for every single entry */
  private async dispatchBuffer(): Promise<void> {
    while (true) {
      // Stop this dispatching loop if the directive is there
      if (this.stopping) {
        this.stopping = false
        this.internalBusy = false
        this.dispatchPromise = null

        if (this.buffer.length > 0) {
          this.emit('stopped')
        } else {
          this.emit('finished')
        }
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
        this.dispatchPromise = null
        this.stopping = false

        this.emit('finished')
        break
      }
    }
  }
}
