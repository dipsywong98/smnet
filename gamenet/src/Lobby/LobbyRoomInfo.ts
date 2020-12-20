export interface LobbyRoomInfo {
  peerId: string
  roomNetworkName: string
  url: string
  started?: boolean
  members: {
    [peerId: string]: string;
  }
}
