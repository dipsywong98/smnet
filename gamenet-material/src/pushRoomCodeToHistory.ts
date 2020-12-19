export const pushRoomCodeToHistory = (gameName: string, roomCode?: string): void => {
  let title = gameName
  if (roomCode !== undefined) {
    title = `${roomCode} - ${gameName}`
  }
  window.history.pushState({
    roomCode: roomCode
  }, title, `#/${roomCode ?? ''}`)
  window.document.title = title
}
