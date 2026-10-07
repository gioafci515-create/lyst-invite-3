import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export type Doc = { id: string; createdAt: string };

// One queue for every collection: writes are rare and this keeps things simple and safe.
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

const file = (name: string) => path.join(DATA_DIR, `${name}.json`);

async function read<T>(name: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(file(name), "utf8")) as T[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function write<T>(name: string, items: T[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${file(name)}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, file(name));
}

export async function list<T extends Doc>(name: string): Promise<T[]> {
  const items = await read<T>(name);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function insert<T extends Doc>(
  name: string,
  data: Omit<T, "id" | "createdAt">,
): Promise<T> {
  return withLock(async () => {
    const items = await read<T>(name);
    const doc = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    } as T;
    items.push(doc);
    await write(name, items);
    return doc;
  });
}

export function patch<T extends Doc>(
  name: string,
  id: string,
  changes: Partial<Omit<T, "id" | "createdAt">>,
): Promise<T | null> {
  return withLock(async () => {
    const items = await read<T>(name);
    const i = items.findIndex((d) => d.id === id);
    if (i === -1) return null;
    items[i] = { ...items[i], ...changes };
    await write(name, items);
    return items[i];
  });
}

export function remove<T extends Doc>(
  name: string,
  match: (d: T) => boolean,
): Promise<T[]> {
  return withLock(async () => {
    const items = await read<T>(name);
    const gone = items.filter(match);
    if (gone.length) await write(name, items.filter((d) => !match(d)));
    return gone;
  });
}

/** Insert only when no existing doc satisfies `exists`. Returns null if one did. */
export function insertUnique<T extends Doc>(
  name: string,
  data: Omit<T, "id" | "createdAt">,
  exists: (d: T) => boolean,
): Promise<T | null> {
  return withLock(async () => {
    const items = await read<T>(name);
    if (items.some(exists)) return null;
    const doc = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    } as T;
    items.push(doc);
    await write(name, items);
    return doc;
  });
}

export async function saveUpload(id: string, ext: string, bytes: Buffer) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, `${id}${ext}`), bytes);
}

export const uploadPath = (storedName: string) =>
  path.join(UPLOAD_DIR, path.basename(storedName));

export async function deleteUpload(storedName: string) {
  await fs.rm(uploadPath(storedName), { force: true });
}
