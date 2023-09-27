import { BufferDispatcher } from '../src'

interface Payload {
  message: string
}

describe(BufferDispatcher, (): void => {
  it('makes sure async calls are executed in a linear way and in the specified order', async (): Promise<void> => {
    const messages: string[] = []
    const dispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }

    const bufferDispatcher = new BufferDispatcher(dispatcher)

    bufferDispatcher.append({ message: '1' })
    bufferDispatcher.append({ message: '2' })
    bufferDispatcher.append({ message: '3' })
    bufferDispatcher.append({ message: '4' })

    expect(bufferDispatcher.isBusy()).toBeTruthy()

    await bufferDispatcher.await()

    expect(messages).toEqual(['1', '2', '3', '4'])
  })

  it('can stops and continue any time', async (): Promise<void> => {
    const messages: string[] = []
    const dispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }

    const bufferDispatcher = new BufferDispatcher(dispatcher)

    bufferDispatcher.append({ message: '1' })
    bufferDispatcher.append({ message: '2' })
    bufferDispatcher.append({ message: '3' })
    bufferDispatcher.append({ message: '4' })

    await bufferDispatcher.stop()

    expect(messages).not.toEqual(['1', '2', '3', '4'])

    bufferDispatcher.continue()
    await bufferDispatcher.await()

    expect(messages).toEqual(['1', '2', '3', '4'])
  })

  it('can be cleared to stop and clear future dispatches', async (): Promise<void> => {
    const messages: string[] = []
    const dispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }

    const bufferDispatcher = new BufferDispatcher(dispatcher)

    bufferDispatcher.append({ message: '1' })
    bufferDispatcher.append({ message: '2' })
    bufferDispatcher.append({ message: '3' })
    bufferDispatcher.append({ message: '4' })

    bufferDispatcher.clear()
    await bufferDispatcher.await()

    expect(messages).not.toEqual(['1', '2', '3', '4'])
  })

  it('can be cleared to stop and clear future dispatches', async (): Promise<void> => {
    let errorToTest: Error

    try {
      const dispatcher = async (_payload: Payload): Promise<void> => {
        throw new Error()
      }

      const bufferDispatcher = new BufferDispatcher<Payload>(dispatcher)

      bufferDispatcher.append({ message: 'Bad batch' })

      await bufferDispatcher.await()
    } catch (error) {
      errorToTest = error
    }

    expect(errorToTest.cause).toEqual('On Buffer Dispatcher with entry {"message":"Bad batch"}')
  })
})
