export const i18nSub = (template: string, values: Record<string, string>): string => {
  return Object.entries(values).reduce((str, [key, value]) => str.replace(`{{${key}}}`, value), template)
}
