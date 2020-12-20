export interface LobbyRoomInfo {
  peerId: string
  roomNetworkName: string
  url: string
  members: {
    [peerId: string]: string;
  }
}
