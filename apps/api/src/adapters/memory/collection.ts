export class Collection<T extends { id: string }> {
  private items: T[];

  constructor(seed: readonly T[] = []) {
    this.items = [...seed];
  }

  all(): T[] {
    return [...this.items];
  }

  find(id: string): T | null {
    return this.items.find(item => item.id === id) ?? null;
  }

  insert(item: T): T {
    this.items.push(item);
    return item;
  }

  patch(id: string, patch: Partial<T>): T | null {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;
    const current = this.items[index] as T;
    const next = { ...current, ...patch, id: current.id };
    this.items[index] = next;
    return next;
  }

  remove(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    return this.items.length < before;
  }

  replaceAll(items: readonly T[]): void {
    this.items = [...items];
  }
}
