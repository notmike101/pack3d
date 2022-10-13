import { parentPort } from 'worker_threads';

export const Verbosity = {
  SILENT: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0,
};

export class Logger {
  static Verbosity = Verbosity;

  public static DEFAULT_INSTANCE = new Logger(Logger.Verbosity.INFO);

  constructor(private readonly verbosity: number) {
    this.verbosity = verbosity;
  }

  private postMessage(text: string) {
    if (!parentPort) return;

    parentPort.postMessage({
      type: 'logging',
      verbosity: this.verbosity,
      text,
    });
  }

  public debug(text: string) {
    if (this.verbosity <= Logger.Verbosity.DEBUG) {
      this.postMessage(text);
    }
  }

  public info(text: string) {
    if (this.verbosity <= Logger.Verbosity.INFO) {
      this.postMessage(text);
    }
  }

  public warn(text: string) {
    if (this.verbosity <= Logger.Verbosity.WARN) {
      this.postMessage(text);
    }
  }

  public error(text: string) {
    if (this.verbosity <= Logger.Verbosity.ERROR) {
      this.postMessage(text);
    }
  }
}

export default {
  Logger,
  Verbosity,
};
