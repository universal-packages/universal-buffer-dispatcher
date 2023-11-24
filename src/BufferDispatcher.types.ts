export type Dispatcher<T> = (entry: T) => Promise<void>
export type OnErrorAction = 'continue' | 'stop' | 'clear'

export interface BufferDispatcherOptions<T = any> {
  entryDispatcher: Dispatcher<T>
  onError?: OnErrorAction
}
