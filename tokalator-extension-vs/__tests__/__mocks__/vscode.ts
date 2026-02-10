/**
 * Minimal mock of the vscode module for unit testing.
 * Only stubs the interfaces used by the modules under test.
 */
export class Uri {
  static file(path: string): Uri {
    return new Uri(path);
  }
  readonly fsPath: string;
  constructor(path: string) {
    this.fsPath = path;
  }
  toString(): string {
    return `file://${this.fsPath}`;
  }
}

export const workspace = {
  textDocuments: [],
  getConfiguration: () => ({
    get: () => undefined,
  }),
};

export const window = {
  activeTextEditor: undefined,
};

export const EventEmitter = class {
  event = () => {};
  fire() {}
  dispose() {}
};
