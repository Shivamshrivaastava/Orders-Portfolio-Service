/* eslint-disable @typescript-eslint/no-explicit-any */

type Handler = (payload: any) => void | Promise<void>;

class EventBus {
  private subs = new Map<string, Set<Handler>>();
  publish(eventName: string, payload: any) {
    const set = this.subs.get(eventName);
    if (!set) return;
    for (const h of set) Promise.resolve(h(payload)).catch(() => {});
  }
  subscribe(eventName: string, handler: Handler) {
    const set = this.subs.get(eventName) ?? new Set<Handler>();
    set.add(handler);
    this.subs.set(eventName, set);
    return () => set.delete(handler);
  }
}
export const eventBus = new EventBus();
