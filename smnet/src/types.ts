export type InitialStateFactory = <T>(overrides?: Partial<T>) => T

export type NetworkAction = Record<string, unknown>
