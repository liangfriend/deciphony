export function newId(): string {
  return crypto.randomUUID();
}

export function assertIndex(name: string, index: number, length: number): void {
  if (index < 0 || index >= length) {
    throw new RangeError(`${name} 索引 ${index} 越界（长度 ${length}）`);
  }
}

export function clampInsertIndex(at: number | undefined, length: number): number {
  if (at == null) return length;
  if (at < 0) return 0;
  if (at > length) return length;
  return at;
}
