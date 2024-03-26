import { Measurement } from '@universal-packages/time-measurer'

import { BufferDispatcher } from '../src'

interface Payload {
  message: string
}

describe(BufferDispatcher, (): void => {
  it('makes sure async calls are executed in a linear way and in the specified order', async (): Promise<void> => {
    const messages: string[] = []
    const entryDispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }
    const eventListener = jest.fn()

    const bufferDispatcher = new BufferDispatcher({ entryDispatcher })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: '1' })
    bufferDispatcher.push({ message: '2' })
    bufferDispatcher.push({ message: '3' })
    bufferDispatcher.push({ message: '4' })

    expect(bufferDispatcher.busy).toBeTruthy()

    await bufferDispatcher.waitFor('finished')

    expect(messages).toEqual(['1', '2', '3', '4'])
    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: '1' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: '1' } } }],
      [{ event: 'push', payload: { entry: { message: '2' } } }],
      [{ event: 'push', payload: { entry: { message: '3' } } }],
      [{ event: 'push', payload: { entry: { message: '4' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '1' } } }],
      [{ event: 'dispatching', payload: { entry: { message: '2' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '2' } } }],
      [{ event: 'dispatching', payload: { entry: { message: '3' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '3' } } }],
      [{ event: 'dispatching', payload: { entry: { message: '4' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '4' } } }],
      [{ event: 'finished' }],
      [{ event: 'idle' }]
    ])
  })

  it('can stop and continue any time', async (): Promise<void> => {
    const messages: string[] = []
    const entryDispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }
    const eventListener = jest.fn()

    const bufferDispatcher = new BufferDispatcher({ entryDispatcher })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: '1' })
    bufferDispatcher.push({ message: '2' })
    bufferDispatcher.push({ message: '3' })
    bufferDispatcher.push({ message: '4' })

    await bufferDispatcher.stop()

    expect(messages).not.toEqual(['1', '2', '3', '4'])
    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: '1' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: '1' } } }],
      [{ event: 'push', payload: { entry: { message: '2' } } }],
      [{ event: 'push', payload: { entry: { message: '3' } } }],
      [{ event: 'push', payload: { entry: { message: '4' } } }],
      [{ event: 'stopping' }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '1' } } }],
      [{ event: 'stopped' }],
      [{ event: 'idle' }]
    ])

    bufferDispatcher.continue()
    await bufferDispatcher.waitFor('idle')

    expect(messages).toEqual(['1', '2', '3', '4'])
    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: '1' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: '1' } } }],
      [{ event: 'push', payload: { entry: { message: '2' } } }],
      [{ event: 'push', payload: { entry: { message: '3' } } }],
      [{ event: 'push', payload: { entry: { message: '4' } } }],
      [{ event: 'stopping' }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '1' } } }],
      [{ event: 'stopped' }],
      [{ event: 'idle' }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: '2' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '2' } } }],
      [{ event: 'dispatching', payload: { entry: { message: '3' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '3' } } }],
      [{ event: 'dispatching', payload: { entry: { message: '4' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '4' } } }],
      [{ event: 'finished' }],
      [{ event: 'idle' }]
    ])
  })

  it('can be cleared to stop and clear future dispatches', async (): Promise<void> => {
    const messages: string[] = []
    const entryDispatcher = async (payload: Payload): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, Math.random()))
      messages.push(payload.message)
    }
    const eventListener = jest.fn()

    const bufferDispatcher = new BufferDispatcher({ entryDispatcher })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: '1' })
    bufferDispatcher.push({ message: '2' })
    bufferDispatcher.push({ message: '3' })
    bufferDispatcher.push({ message: '4' })

    bufferDispatcher.clear()
    await bufferDispatcher.waitFor('idle')

    expect(messages).not.toEqual(['1', '2', '3', '4'])
    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: '1' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: '1' } } }],
      [{ event: 'push', payload: { entry: { message: '2' } } }],
      [{ event: 'push', payload: { entry: { message: '3' } } }],
      [{ event: 'push', payload: { entry: { message: '4' } } }],
      [{ event: 'cleared' }],
      [{ event: 'stopping' }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: '1' } } }],
      [{ event: 'finished' }],
      [{ event: 'idle' }]
    ])
  })

  it('it continues if an error occurs', async (): Promise<void> => {
    const eventListener = jest.fn()

    const entryDispatcher = async (payload: Payload): Promise<void> => {
      if (payload.message === 'Bad') throw new Error('Bad')
    }

    const bufferDispatcher = new BufferDispatcher<Payload>({ entryDispatcher })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: 'Bad' })
    bufferDispatcher.push({ message: 'Good' })

    await bufferDispatcher.waitFor('idle')

    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'push', payload: { entry: { message: 'Good' } } }],
      [{ event: 'error', measurement: expect.any(Measurement), error: new Error('Bad'), payload: { entry: { message: 'Bad' } } }],
      [{ event: 'dispatching', payload: { entry: { message: 'Good' } } }],
      [{ event: 'dispatched', measurement: expect.any(Measurement), payload: { entry: { message: 'Good' } } }],
      [{ event: 'finished' }],
      [{ event: 'idle' }]
    ])
  })

  it('it stops if an error occurs', async (): Promise<void> => {
    const eventListener = jest.fn()

    const entryDispatcher = async (payload: Payload): Promise<void> => {
      if (payload.message === 'Bad') throw new Error('Bad')
    }

    const bufferDispatcher = new BufferDispatcher<Payload>({ entryDispatcher, onError: 'stop' })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: 'Bad' })
    bufferDispatcher.push({ message: 'Good' })

    await bufferDispatcher.waitFor('idle')

    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'push', payload: { entry: { message: 'Good' } } }],
      [{ event: 'error', measurement: expect.any(Measurement), error: new Error('Bad'), payload: { entry: { message: 'Bad' } } }],
      [{ event: 'stopping' }],
      [{ event: 'stopped' }],
      [{ event: 'idle' }]
    ])
  })

  it('it clears if an error occurs', async (): Promise<void> => {
    const eventListener = jest.fn()

    const entryDispatcher = async (payload: Payload): Promise<void> => {
      if (payload.message === 'Bad') throw new Error('Bad')
    }

    const bufferDispatcher = new BufferDispatcher<Payload>({ entryDispatcher, onError: 'clear' })

    bufferDispatcher.on('*', eventListener)

    bufferDispatcher.push({ message: 'Bad' })
    bufferDispatcher.push({ message: 'Good' })

    await bufferDispatcher.waitFor('idle')

    expect(eventListener.mock.calls).toEqual([
      [{ event: 'push', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'resuming' }],
      [{ event: 'dispatching', payload: { entry: { message: 'Bad' } } }],
      [{ event: 'push', payload: { entry: { message: 'Good' } } }],
      [{ event: 'error', measurement: expect.any(Measurement), error: new Error('Bad'), payload: { entry: { message: 'Bad' } } }],
      [{ event: 'cleared' }],
      [{ event: 'stopping' }],
      [{ event: 'finished' }],
      [{ event: 'idle' }]
    ])
  })
})
