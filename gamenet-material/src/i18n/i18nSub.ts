export const i18nSub = <T>(template: T, values: Record<string, string>): T => {
  // @ts-ignore
  return typeof template === 'string'
    ? Object.entries(values).reduce((str, [key, value]) => str.replace(`{{${key}}}`, value), template as string)
    : template
}
