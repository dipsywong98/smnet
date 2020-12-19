export interface LobbyRoomInfo {
  peerId: string
  roomNetworkName: string
  members: {
    [peerId: string]: string;
  }
}
