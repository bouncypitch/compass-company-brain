import chokidar, { type FSWatcher } from "chokidar";
import type { RepoIndexer } from "./repoIndexer.js";

const DEBOUNCE_MS = 400;

/**
 * Keeps the in-memory index in sync with edits made during a session
 * (by the user or by the agent itself).
 *
 * This only covers changes *while the process is alive*. Edits made between
 * sessions are picked up because we re-index everything on startup anyway —
 * see RepoIndexer.indexAll(). If we ever persist the index (R-14), this needs
 * a "what changed since last session" pass, probably via `git diff` against a
 * stored commit sha.
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private pending = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly repoRoot: string,
    private readonly indexer: RepoIndexer,
    private readonly onReindexed?: (path: string) => void,
  ) {}

  start(): void {
    if (this.watcher) return;
    this.watcher = chokidar.watch(".", {
      cwd: this.repoRoot,
      ignoreInitial: true,
      ignored: [/node_modules/, /\.git\//, /dist\//],
    });

    this.watcher.on("add", (p) => this.schedule(p));
    this.watcher.on("change", (p) => this.schedule(p));
    this.watcher.on("unlink", (p) => this.indexer.index.removeByPath(p));
  }

  private schedule(path: string): void {
    const existing = this.pending.get(path);
    if (existing) clearTimeout(existing);

    // Debounce: editors fire multiple change events per save (FL-2044).
    const timer = setTimeout(async () => {
      this.pending.delete(path);
      try {
        await this.indexer.indexFile(path);
        this.onReindexed?.(path);
      } catch (err) {
        console.warn(`[fileWatcher] reindex failed for ${path}:`, err);
      }
    }, DEBOUNCE_MS);

    this.pending.set(path, timer);
  }

  async stop(): Promise<void> {
    for (const t of this.pending.values()) clearTimeout(t);
    this.pending.clear();
    await this.watcher?.close();
    this.watcher = null;
  }
}
