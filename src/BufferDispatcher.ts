import { Dispatcher } from './BufferDispatcher.types'

/**
 *
 * It accumulates an array of entries and will call the dispatcher for
 * every single one of them but awaiting before dispatching the next one
 *
 */
export default class BufferDispatcher<T> {
  private readonly dispatcher: Dispatcher<T>
  private busy = false
  private buffer: T[] = []
  private dispatchPromise: Promise<void>
  private stopping = false

  public constructor(dispatcher: Dispatcher<T>) {
    this.dispatcher = dispatcher
  }

  /** Adds a new entry to the buffer and starts dispatching if not already active */
  public append(entry: T): void {
    this.buffer.push(entry)
    this.continue()
  }

  /** Returns the current dispatch promise so you can wait for all the entries to finish */
  public async await(): Promise<void> {
    return this.dispatchPromise
  }

  /** Starts dispatching again in case it was stopped */
  public continue(): void {
    if (!this.busy) {
      this.busy = true
      this.dispatchPromise = this.dispatchBuffer()
    }
  }

  /** Clears the current buffer */
  public async clear(): Promise<void> {
    if (this.busy) {
      this.buffer = []
      return this.stop()
    }
  }

  /** Returns true if the buffer cotans entries being dispatched */
  public isBusy(): boolean {
    return this.busy
  }

  /** Stops dispatching */
  public async stop(): Promise<void> {
    if (this.busy) {
      this.stopping = true
      return await this.dispatchPromise
    }
  }

  /** Loops and awaits the callback function for every single entry */
  private async dispatchBuffer(): Promise<void> {
    while (true) {
      // Stop this dispatching loop if the directive is there
      if (this.stopping) {
        this.stopping = false
        this.busy = false
        this.dispatchPromise = null
        break
      }

      const next = this.buffer.shift()

      try {
        await this.dispatcher(next)
      } catch (error) {
        error.cause = `On Buffer Dispatcher with entry ${JSON.stringify(next)}`

        throw error
      }

      if (this.buffer.length === 0) {
        this.busy = false
        this.dispatchPromise = null
        this.stopping = false
        break
      }
    }
  }
}
