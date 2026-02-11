/**
 * Mock of the vscode module for unit testing.
 * Stubs the interfaces used by modelProfiles, contextMonitor, and contextDashboardProvider.
 */

// ── Uri ──────────────────────────────────────────────
export class Uri {
  static file(path: string): Uri {
    return new Uri('file', '', path, '', '');
  }
  static parse(raw: string): Uri {
    // Very simple parser for file:// URIs
    if (raw.startsWith('file://')) {
      return new Uri('file', '', raw.slice(7), '', '');
    }
    return new Uri('file', '', raw, '', '');
  }

  readonly scheme: string;
  readonly authority: string;
  readonly path: string;
  readonly query: string;
  readonly fragment: string;
  readonly fsPath: string;

  constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
    this.fsPath = path;
  }

  toString(): string {
    return `file://${this.fsPath}`;
  }

  with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
    return new Uri(
      change.scheme ?? this.scheme,
      change.authority ?? this.authority,
      change.path ?? this.path,
      change.query ?? this.query,
      change.fragment ?? this.fragment,
    );
  }
}

// ── EventEmitter ─────────────────────────────────────
export class EventEmitter<T = any> {
  private listeners: Array<(e: T) => void> = [];

  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => { this.listeners = this.listeners.filter(l => l !== listener); } };
  };

  fire(data: T) {
    for (const l of this.listeners) { l(data); }
  }

  dispose() { this.listeners = []; }
}

// ── ConfigurationTarget ──────────────────────────────
export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

// ── TabInputText ─────────────────────────────────────
export class TabInputText {
  constructor(public readonly uri: Uri) {}
}

// ── workspace ────────────────────────────────────────
export const workspace = {
  textDocuments: [] as any[],
  workspaceFolders: [{ uri: Uri.file('/workspace'), name: 'workspace', index: 0 }],
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key: string, defaultVal?: any) => defaultVal),
    update: jest.fn(async () => {}),
  })),
  openTextDocument: jest.fn(async (uri: Uri) => ({ uri, languageId: 'typescript', getText: () => '' })),
  onDidChangeTextDocument: jest.fn(() => ({ dispose: () => {} })),
  onDidOpenTextDocument: jest.fn(() => ({ dispose: () => {} })),
  onDidCloseTextDocument: jest.fn(() => ({ dispose: () => {} })),
  onDidChangeConfiguration: jest.fn(() => ({ dispose: () => {} })),
  findFiles: jest.fn(async () => []),
  fs: { readFile: jest.fn(async () => new Uint8Array()) },
};

// ── window ───────────────────────────────────────────
export const window = {
  activeTextEditor: undefined as any,
  tabGroups: {
    all: [] as any[],
    onDidChangeTabs: jest.fn(() => ({ dispose: () => {} })),
    close: jest.fn(async () => {}),
  },
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: () => {} })),
  onDidChangeTextEditorSelection: jest.fn(() => ({ dispose: () => {} })),
  showInformationMessage: jest.fn(async () => undefined),
  showTextDocument: jest.fn(async () => {}),
};

// ── languages ────────────────────────────────────────
export const languages = {
  getDiagnostics: jest.fn(() => []),
  onDidChangeDiagnostics: jest.fn(() => ({ dispose: () => {} })),
};

// ── Diagnostic severity ──────────────────────────────
export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}
