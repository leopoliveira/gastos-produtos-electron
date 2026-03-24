import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createEmptyDatabaseState, type DatabaseState } from '../domain/entities';

export class AppDataStore {
  private cachedState?: DatabaseState;

  private mutationQueue = Promise.resolve<unknown>(undefined);

  constructor(private readonly filePath: string) {}

  async read<T>(reader: (state: DatabaseState) => T | Promise<T>): Promise<T> {
    const state = await this.loadState();
    return reader(state);
  }

  async mutate<T>(writer: (state: DatabaseState) => T | Promise<T>): Promise<T> {
    const runMutation = async (): Promise<T> => {
      const state = await this.loadState();
      const result = await writer(state);
      await this.persistState(state);
      return result;
    };

    const pendingMutation = this.mutationQueue.then(runMutation, runMutation);
    this.mutationQueue = pendingMutation.then(
      () => undefined,
      () => undefined,
    );

    return pendingMutation;
  }

  private async loadState(): Promise<DatabaseState> {
    if (this.cachedState) {
      return this.cachedState;
    }

    try {
      const rawState = await readFile(this.filePath, 'utf8');
      this.cachedState = this.normalizeState(JSON.parse(rawState) as Partial<DatabaseState>);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }

      this.cachedState = createEmptyDatabaseState();
      await this.persistState(this.cachedState);
    }

    return this.cachedState;
  }

  private normalizeState(state: Partial<DatabaseState>): DatabaseState {
    return {
      products: state.products ?? [],
      packings: state.packings ?? [],
      groups: state.groups ?? [],
      recipes: state.recipes ?? [],
    };
  }

  private async persistState(state: DatabaseState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }
}
