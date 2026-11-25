type Where<T> = Partial<T>;

function matches<T>(item: T, where: Where<T>): boolean {
  return Object.entries(where).every(([key, value]) => item[key as keyof T] === value);
}

export class Collection<T extends { id: string }> {
  private items: T[];

  constructor(seed: readonly T[] = []) {
    this.items = [...seed];
  }

  all(): T[] {
    return [...this.items];
  }

  find(id: string, where: Where<T> = {}): T | null {
    return this.items.find(item => item.id === id && matches(item, where)) ?? null;
  }

  findWhere(where: Where<T>): T | null {
    return this.items.find(item => matches(item, where)) ?? null;
  }

  filter(where: Where<T>): T[] {
    return this.items.filter(item => matches(item, where));
  }

  insert(item: T): T {
    this.items.push(item);
    return item;
  }

  patch(id: string, patch: Partial<T>, where: Where<T> = {}): T | null {
    const current = this.find(id, where);
    if (!current) return null;
    const next = { ...current, ...patch, id: current.id };
    this.items = this.items.map(item => (item.id === id ? next : item));
    return next;
  }

  upsert(where: Where<T>, item: T, patch: Partial<T>): T {
    const current = this.findWhere(where);
    if (!current) return this.insert(item);
    return this.patch(current.id, patch) as T;
  }

  remove(id: string, where: Where<T> = {}): boolean {
    if (!this.find(id, where)) return false;
    this.items = this.items.filter(item => item.id !== id);
    return true;
  }
}
