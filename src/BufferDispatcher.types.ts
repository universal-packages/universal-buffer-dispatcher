export type Dispatcher<T> = (entry: T) => Promise<void>
