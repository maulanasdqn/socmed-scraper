type Predicate = (value: Record<string, unknown>) => boolean;

export const collectObjects = (root: unknown, predicate: Predicate): Record<string, unknown>[] => {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const stack: unknown[] = [root];

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (!Array.isArray(node)) {
      const record = node as Record<string, unknown>;
      if (predicate(record)) out.push(record);
      stack.push(...Object.values(record));
    } else {
      stack.push(...node);
    }
  }
  return out;
};

export const firstObject = (
  root: unknown,
  predicate: Predicate,
): Record<string, unknown> | null => collectObjects(root, predicate)[0] ?? null;
