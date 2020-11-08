export enum LoggerLevel {
  ALL,
  TRACE,
  LOG,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  OFF
}

interface Log {
  level: LoggerLevel
  message: unknown[]
  date: Date
}

type LogFunction = (...message: unknown[]) => void

class Logger {
  set historyLevel (value: LoggerLevel) {
    this._historyLevel = value
  }

  set verboseLevel (value: LoggerLevel) {
    this._verboseLevel = value
  }

  set keep (value: number) {
    this._keep = value
  }

  private _historyLevel: LoggerLevel
  private _verboseLevel: LoggerLevel
  private _keep: number
  private readonly _logs: Log[] = []

  constructor (historyLevel: LoggerLevel, verbose: LoggerLevel, keep: number) {
    this._historyLevel = historyLevel
    this._verboseLevel = verbose
    this._keep = keep
  }

  private readonly pushLog = (level: LoggerLevel, date: Date, ...message: unknown[]): void => {
    if (this._logs.length >= this._keep) {
      this._logs.shift()
    }
    this._logs.push({
      level,
      message,
      date: new Date()
    })
  }

  private readonly getLogFunction: (level: LoggerLevel) => LogFunction = level => {
    if (level < this._verboseLevel) {
      return () => {
        //
      }
    }
    switch (level) {
      case LoggerLevel.INFO:
        return console.info.bind(window.console)
      case LoggerLevel.LOG:
        return console.log.bind(window.console)
      case LoggerLevel.DEBUG:
        return console.log.bind(window.console)
      case LoggerLevel.ERROR:
        return console.error.bind(window.console)
      case LoggerLevel.WARN:
        return console.warn.bind(window.console)
      case LoggerLevel.TRACE:
        return console.trace.bind(window.console)
      default:
        return () => {
          //
        }
    }
  }

  private readonly withColor: (level: LoggerLevel, date?: Date) => (logFunction: LogFunction) => LogFunction = (level, date) => logFunction => {
    const css = {
      [LoggerLevel.INFO]: 'color: DodgerBlue',
      [LoggerLevel.LOG]: '',
      [LoggerLevel.DEBUG]: 'color: Green',
      [LoggerLevel.ERROR]: '',
      [LoggerLevel.WARN]: '',
      [LoggerLevel.TRACE]: 'color: Green',
      [LoggerLevel.ALL]: '',
      [LoggerLevel.OFF]: ''
    }[level]
    const prefix = date === undefined ? `%c[${LoggerLevel[level]}]` : `%c[${date.toISOString()} ${LoggerLevel[level]}]`
    return Function.prototype.bind.call(logFunction, console, prefix, css) as LogFunction
  }

  private readonly withHistoryButWrongLineNumber: (level: LoggerLevel) => (logFunction: LogFunction) => LogFunction = level => logFunction => {
    return new Proxy(logFunction, {
      apply: (target: LogFunction, thisArg: unknown, argList: unknown[]) => {
        const date = new Date()
        this.pushLog(level, date, ...argList)
        return target(...argList)
      }
    })
  }

  private readonly withAllFeatures: (level: LoggerLevel) => LogFunction = level => {
    if (level >= this._historyLevel) {
      return this.withHistoryButWrongLineNumber(level)(this.withColor(level)(this.getLogFunction(level)))
    } else {
      return this.withColor(level)(this.getLogFunction(level))
    }
  }

  clear = (): void => {
    this._logs.splice(0, this._logs.length)
  }

  public get info (): LogFunction {
    return this.withAllFeatures(LoggerLevel.INFO)
  }

  public get log (): LogFunction {
    return this.withAllFeatures(LoggerLevel.LOG)
  }

  public get debug (): LogFunction {
    return this.withAllFeatures(LoggerLevel.DEBUG)
  }

  public get error (): LogFunction {
    return this.withAllFeatures(LoggerLevel.ERROR)
  }

  public get warn (): LogFunction {
    return this.withAllFeatures(LoggerLevel.WARN)
  }

  public get trace (): LogFunction {
    return this.withAllFeatures(LoggerLevel.TRACE)
  }

  printLogs = (): void => {
    this._logs.forEach(({ level, message, date }) => {
      this.withColor(level, date)(this.getLogFunction(level))(...message)
    })
  }

  getLogs = (level = LoggerLevel.ALL): Log[] => {
    return this._logs.filter((log) => log.level >= level)
  }
}

export const createLogger = (): Logger => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return new Logger(LoggerLevel.ALL, LoggerLevel.WARN, 100)
    case 'production':
      return new Logger(LoggerLevel.ALL, LoggerLevel.WARN, 100)
    default:
      return new Logger(LoggerLevel.OFF, LoggerLevel.OFF, 0)
  }
}

export const logger = createLogger()

if (process.env.REACT_APP_SMNET_VERBOSE_ALL_NO_HISTORY !== undefined) {
  logger.historyLevel = LoggerLevel.OFF
  logger.verboseLevel = LoggerLevel.ALL
}
