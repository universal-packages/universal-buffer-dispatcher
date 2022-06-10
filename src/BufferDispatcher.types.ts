export interface BufferDispatcherOptions<T> {
  dispatcher: (entry: T) => Promise<void> | void
}
