export function register() {
  // Node.js v22+ expone localStorage como global Web Storage API.
  // Sin --localstorage-file válido, getItem/setItem lanzan TypeError.
  // Parcheamos con un storage en memoria antes de que cualquier módulo lo use.
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      globalThis.localStorage.getItem('__test__')
    } catch {
      const mem = new Map<string, string>()
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (k: string) => mem.get(k) ?? null,
          setItem: (k: string, v: string) => { mem.set(k, v) },
          removeItem: (k: string) => { mem.delete(k) },
          clear: () => mem.clear(),
          get length() { return mem.size },
          key: (i: number) => [...mem.keys()][i] ?? null,
        },
        writable: true,
        configurable: true,
      })
    }
  }
}
