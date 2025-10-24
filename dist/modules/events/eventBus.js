/* eslint-disable @typescript-eslint/no-explicit-any */
class EventBus {
    subs = new Map();
    publish(eventName, payload) {
        const set = this.subs.get(eventName);
        if (!set)
            return;
        for (const h of set)
            Promise.resolve(h(payload)).catch(() => { });
    }
    subscribe(eventName, handler) {
        const set = this.subs.get(eventName) ?? new Set();
        set.add(handler);
        this.subs.set(eventName, set);
        return () => set.delete(handler);
    }
}
export const eventBus = new EventBus();
