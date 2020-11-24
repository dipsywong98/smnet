import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator'

export const getRandomName = (): string => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    style: 'capital',
    separator: ' '
  })
}
