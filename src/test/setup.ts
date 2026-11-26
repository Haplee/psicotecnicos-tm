import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) ?? null) : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value))
    },
  }
}

const memoryLocalStorage = createMemoryStorage()
const memorySessionStorage = createMemoryStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryLocalStorage,
  configurable: true,
  writable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: memorySessionStorage,
  configurable: true,
  writable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryLocalStorage,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: memorySessionStorage,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  memoryLocalStorage.clear()
  memorySessionStorage.clear()
})

afterEach(() => {
  cleanup()
  memoryLocalStorage.clear()
  memorySessionStorage.clear()
})

if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '')
    }
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open')
    }
  }
}
