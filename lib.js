export class Global {
    static context = new Array()
    static bindText(elem, callback) {
        const unsubscribe = new Set()
        const subscribe = (unsubscribeFn) => {
            unsubscribe.add(unsubscribeFn)
            return () => {
                elem.textContent = callback()
            }
        }
        this.context.push(subscribe)
        callback()
        this.context.pop()
        return unsubscribe
    }
    static $ = (val) => observable(val)
    static $$ = (val) => observable({ val })
}

const observable = (target, _base=[]) => {
    for (const key in target) {
        if (typeof target[key] === 'object')
            target[key] = observable(target[key], callback, [..._base, key]);
    }
    const subscribers = new Map()
    return new Proxy(target, {
        get(target, key) {
            const callback = Global.context.at(-1)
            if (callback) {
                const k = [..._base, key]
                // console.log({k})
                for(const key of k) {
                    if (!subscribers.has(key)) subscribers.set(key, new Set())
                    const callbacks = subscribers.get(key) 
                    callbacks.add(callback(callbacks.delete))
                }
            }
            return target[key];
        },
        set(target, key, value) {
            if (typeof value === 'object')
                    value = observable(value, [..._base, key]);
                target[key] = value
                const k = [..._base, key]
                for(const key of k) {
                    // console.log({key}, [...subscribers.keys()])                    
                    if (subscribers.has(key)) {
                        subscribers.get(key).forEach(callback => callback())
                    }
                }
                return true;
        },
    });
};
