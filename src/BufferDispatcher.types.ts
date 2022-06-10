export type Dispacther<T> = (entry: T) => Promise<void>
