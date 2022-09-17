import LRUCache from 'lru-cache'

export default class Cacher<T> {
  private readonly cache: LRUCache<string, T>

  constructor (maxSizeMB: number, ttlMinutes: number) {
    this.cache = new LRUCache<string, T>({
      maxSize: maxSizeMB * 1024 * 1024,
      ttl: ttlMinutes * 60 * 1000,
      sizeCalculation: (value: any) => { return value == null ? 0 : JSON.stringify(value).length }
    })
  }

  async get (key: string, fetch: () => Promise<T | undefined>): Promise<T | undefined> {
    const cached = this.cache.get(key)
    if (cached != null) return cached
    const value = await fetch()
    if (value != null) this.cache.set(key, value)
    return value
  }

  del (key: string): void {
    this.cache.delete(key)
  }

  reset (): void {
    this.cache.clear()
  }
}
