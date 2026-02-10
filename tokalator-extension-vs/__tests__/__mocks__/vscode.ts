/**
 * Minimal mock of the vscode module for unit testing.
 * Only stubs the interfaces used by the modules under test.
 */
export class Uri {
  readonly scheme: string;
  readonly fsPath: string;

  constructor(path: string) {
    this.fsPath = path;
    this.scheme = 'file';
  }

  static file(path: string): Uri {
    return new Uri(path);
  }

  static parse(uriStr: string): Uri {
    if (uriStr.startsWith('file://')) {
      return new Uri(uriStr.replace('file://', ''));
    }
    return new Uri(uriStr);
  }

  toString(): string {
    return `file://${this.fsPath}`;
  }

  with(_change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
    return this;
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export class ThemeIcon {
  constructor(public readonly id: string) {}
}

export class TabInputText {
  constructor(public readonly uri: Uri) {}
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export const workspace = {
  textDocuments: [] as any[],
  workspaceFolders: undefined as any[] | undefined,
  getConfiguration: (_section?: string) => ({
    get: (_key: string, defaultValue?: any) => defaultValue,
  }),
  findFiles: jest.fn().mockResolvedValue([]),
  openTextDocument: jest.fn().mockResolvedValue({ getText: () => '', uri: Uri.file('') }),
  onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidOpenTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidCloseTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
  asRelativePath: jest.fn((uri: any) => {
    const fsPath = typeof uri === 'string' ? uri : uri.fsPath || uri.toString();
    return fsPath.replace(/^.*\//, '');
  }),
  fs: {
    stat: jest.fn().mockResolvedValue({ size: 1000, type: FileType.File }),
  },
};

export const window = {
  activeTextEditor: undefined as any,
  tabGroups: {
    all: [] as any[],
    onDidChangeTabs: jest.fn(() => ({ dispose: jest.fn() })),
    close: jest.fn().mockResolvedValue(undefined),
  },
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeTextEditorSelection: jest.fn(() => ({ dispose: jest.fn() })),
  createStatusBarItem: jest.fn(() => ({
    text: '',
    tooltip: '',
    command: '',
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn(),
  })),
  showInformationMessage: jest.fn().mockResolvedValue(undefined),
  showWarningMessage: jest.fn().mockResolvedValue(undefined),
  registerWebviewViewProvider: jest.fn(() => ({ dispose: jest.fn() })),
};

export const languages = {
  getDiagnostics: jest.fn().mockReturnValue([]),
  onDidChangeDiagnostics: jest.fn(() => ({ dispose: jest.fn() })),
};

export const commands = {
  registerCommand: jest.fn((_cmd: string, _handler: Function) => ({ dispose: jest.fn() })),
  executeCommand: jest.fn().mockResolvedValue(undefined),
};

export const chat = {
  createChatParticipant: jest.fn((_id: string, _handler: Function) => ({
    iconPath: undefined,
    dispose: jest.fn(),
  })),
};

export const lm = {
  selectChatModels: jest.fn().mockResolvedValue([]),
  onDidChangeChatModels: jest.fn(() => ({ dispose: jest.fn() })),
};

export const EventEmitter = class {
  private listeners: Function[] = [];
  event = (listener: Function) => {
    this.listeners.push(listener);
    return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
  };
  fire(data?: any) { this.listeners.forEach(l => l(data)); }
  dispose() { this.listeners = []; }
};
