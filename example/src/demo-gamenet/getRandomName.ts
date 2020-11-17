import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator'

export const getRandomName = (): string => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    style: 'capital',
    separator: ' '
  })
}
