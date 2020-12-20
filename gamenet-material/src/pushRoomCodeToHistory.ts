import { attachParams } from './urlHelper'

export const pushRoomCodeToHistory = (gameName: string, room?: string): void => {
  let title = gameName
  if (room !== undefined) {
    title = `${room} - ${gameName}`
  }
  window.history.pushState({
    room
  }, title, attachParams({ room: room ?? '' }))
  window.document.title = title
}
