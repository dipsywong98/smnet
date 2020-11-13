import { Poker99Reducer } from './Poker99Reducer'

describe('poker99 reducer', () => {
  it('failed example', () => {
    const action = {
      type: 1,
      payload: {
        type: 0,
        payload: { card: { suit: 3, number: 8 } },
        peerId: 'ai-f-f63e3f7f-b53b-4c39-92e7-a5441a6fc465'
      },
      peerId: 'my-room'
    }
    const state = {
      minPlayer: 4,
      maxPlayer: 4,
      members: {
        'my-room': 'df1b',
        'ai-f-f63e3f7f-b53b-4c39-92e7-a5441a6fc465': 'f',
        'ai-g-8f8ab178-bb49-49d2-a5db-e10a383eee05': 'g',
        'ai-h-b513a4b8-6d5e-4b3a-9dca-c9c9ab7c4a20': 'h'
      },
      spectators: {},
      localPlayers: {},
      aiPlayers: {
        'ai-f-f63e3f7f-b53b-4c39-92e7-a5441a6fc465': 'my-room',
        'ai-g-8f8ab178-bb49-49d2-a5db-e10a383eee05': 'my-room',
        'ai-h-b513a4b8-6d5e-4b3a-9dca-c9c9ab7c4a20': 'my-room'
      },
      nameDict: { df1b: 0, f: 1, g: 2, h: 3 },
      players: ['df1b', 'f', 'g', 'h'],
      ready: {},
      started: true,
      turn: 1,
      direction: -1,
      points: 89,
      dead: {},
      drawDeck: [],
      trashDeck: [],
      playerDeck: [[{ suit: 3, number: 1 }, { suit: 1, number: 1 }, { suit: 3, number: 6 }, {
        suit: 0,
        number: 1
      }, { suit: 1, number: 10 }], [{ suit: 0, number: 4 }, { suit: 0, number: 11 }, {
        suit: 1,
        number: 4
      }, { suit: 3, number: 8 }, { suit: 2, number: 11 }], [{ suit: 0, number: 2 }, {
        suit: 3,
        number: 3
      }, { suit: 0, number: 6 }, { suit: 1, number: 9 }, { suit: 2, number: 6 }], [{
        suit: 2,
        number: 8
      }, { suit: 2, number: 2 }, { suit: 0, number: 3 }, { suit: 2, number: 7 }, {
        suit: 3,
        number: 4
      }]],
      logs: ['game started'],
      networkName: 'my-room'
    }
    expect(Poker99Reducer(state, action)).toBeTruthy()
  })
})
