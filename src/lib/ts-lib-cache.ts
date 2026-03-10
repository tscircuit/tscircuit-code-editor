const memoryCache = new Map<string, string>()
const STORAGE_PREFIX = "tsce-ata-"
const DB_NAME = "tsce-ata-cache"
const DB_STORE = "files"
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    } catch {
      reject(new Error("IndexedDB unavailable"))
    }
  })
  return dbPromise
}

async function getFromIDB(key: string): Promise<string | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly")
      const store = tx.objectStore(DB_STORE)
      const req = store.get(key)
      req.onsuccess = () => resolve((req.result as string) ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function setToIDB(key: string, value: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readwrite")
      const store = tx.objectStore(DB_STORE)
      store.put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}

function getFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key)
  } catch {
    return null
  }
}

function setToStorage(key: string, value: string): void {
  try {
    if (value.length > 50_000) return
    localStorage.setItem(STORAGE_PREFIX + key, value)
  } catch {}
}

export async function fetchWithCache(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString()

  const cached = memoryCache.get(url)
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: { "Content-Type": "application/javascript" },
    })
  }

  const stored = getFromStorage(url)
  if (stored) {
    memoryCache.set(url, stored)
    return new Response(stored, {
      status: 200,
      headers: { "Content-Type": "application/javascript" },
    })
  }

  const idbStored = await getFromIDB(url)
  if (idbStored) {
    memoryCache.set(url, idbStored)
    return new Response(idbStored, {
      status: 200,
      headers: { "Content-Type": "application/javascript" },
    })
  }

  const response = await fetch(input, init)
  if (response.ok) {
    const text = await response.text()
    memoryCache.set(url, text)
    setToStorage(url, text)
    setToIDB(url, text)
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }

  return response
}
