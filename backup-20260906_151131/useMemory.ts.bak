import { useCallback } from 'react'

const DB_NAME = 'SiddhiMemory'
const STORE_NAME = 'conversations'
const KEY = 'current'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useMemory() {
  const loadMemory = useCallback(async (): Promise<any[]> => {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const get = store.get(KEY)
        get.onsuccess = () => resolve(get.result || [])
        get.onerror = () => reject(get.error)
      })
    } catch {
      // Fallback to localStorage
      const raw = localStorage.getItem('siddhi_memory')
      return raw ? JSON.parse(raw) : []
    }
  }, [])

  const saveMemory = useCallback(async (messages: any[]) => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(messages, KEY)
    } catch {
      localStorage.setItem('siddhi_memory', JSON.stringify(messages))
    }
  }, [])

  const clearMemory = useCallback(async () => {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete(KEY)
    } catch {
      localStorage.removeItem('siddhi_memory')
    }
  }, [])

  return { loadMemory, saveMemory, clearMemory }
}
