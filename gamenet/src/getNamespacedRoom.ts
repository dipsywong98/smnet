export const getNamespacedRoom = (room: string, namespace?: string): string => {
  return namespace !== undefined ? `${namespace}_gamenet_namespace_${room}` : room
}

export const extractNamespacedRoom = (namespacedRoom?: string): { room?: string, namespace?: string, namespacedRoom?: string } => {
  if (namespacedRoom === undefined) {
    return {}
  } else if (namespacedRoom.includes('_gamenet_namespace_')) {
    const [namespace, room] = namespacedRoom.split('_gamenet_namespace_')
    return { room , namespace, namespacedRoom }
  } else {
    return { room: namespacedRoom, namespacedRoom }
  }
}

export const validateNamespaceGrammar = (namespace?: string) => {
  if (namespace === undefined) {
    return true
  } else {
    return /^[a-zA-Z0-9]+$/.test(namespace)
  }
}
