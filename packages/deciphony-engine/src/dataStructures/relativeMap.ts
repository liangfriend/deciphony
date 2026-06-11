export class ReactiveMap<K, V> {
    // 可监听变化
    onChange?: (action: 'set' | 'delete' | 'clear', key?: K, value?: V) => void

    private _map = new Map<K, V>()

    get value() {
        return this._map
    }

// ✅ 实现可迭代协议：支持 for...of
    * [Symbol.iterator](): IterableIterator<[K, V]> {
        yield* this._map
    }

    // ✅ 提供 entries(), keys(), values() 以支持常见遍历方式
    entries(): IterableIterator<[K, V]> {
        return this._map.entries()
    }

    keys(): IterableIterator<K> {
        return this._map.keys()
    }

    values(): IterableIterator<V> {
        return this._map.values()
    }

    // ✅ 新增：get 方法
    get(key: K): V | undefined {
        return this._map.get(key)
    }

    // ✅ 新增：has 方法
    has(key: K): boolean {
        return this._map.has(key)
    }

    set(key: K, value: V) {
        const existed = this._map.has(key)
        this._map.set(key, value)
        this.onChange?.('set', key, value)
        return this
    }

    delete(key: K) {
        const target = this._map.get(key)
        const deleted = this._map.delete(key)
        if (deleted) {
            this.onChange?.('delete', key, target)
        }
        return deleted
    }

    clear() {
        this._map.clear()
        this.onChange?.('clear')
    }
}