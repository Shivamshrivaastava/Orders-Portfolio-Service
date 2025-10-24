const CACHE_TTL_MS = 60_000;
const seed = { SPY: 520.0, BND: 74.0, QQQ: 440.0 };
const cache = new Map();
export const quotesService = {
    get(symbol) {
        const key = symbol.toUpperCase();
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && cached.expiresAt > now)
            return cached.price;
        const base = seed[key] ?? 100;
        const jitter = (Math.random() - 0.5) * 0.5;
        const price = Math.max(1, base + jitter);
        cache.set(key, { price, expiresAt: now + CACHE_TTL_MS });
        return price;
    },
    set(symbol, price) {
        const key = symbol.toUpperCase();
        cache.set(key, { price, expiresAt: Date.now() + CACHE_TTL_MS });
    },
};
