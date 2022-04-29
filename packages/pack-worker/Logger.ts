import { parentPort } from 'worker_threads';

export const Verbosity = {
  SILENT: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0,
};

export class Logger {
  // private verbosity: number;

  static Verbosity = Verbosity;

  public static DEFAULT_INSTANCE = new Logger(Logger.Verbosity.INFO);

  constructor(private readonly verbosity: number) {
    this.verbosity = verbosity;
  }

  debug(text) {
    if (this.verbosity <= Logger.Verbosity.DEBUG) {
      parentPort!.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  info(text) {
    if (this.verbosity <= Logger.Verbosity.INFO) {
      parentPort!.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  warn(text) {
    if (this.verbosity <= Logger.Verbosity.WARN) {
      parentPort!.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }

  error(text) {
    if (this.verbosity <= Logger.Verbosity.ERROR) {
      parentPort!.postMessage({
        type: 'logging',
        verbosity: this.verbosity,
        text,
      });
    }
  }
}

export default {
  Logger,
  Verbosity,
};
