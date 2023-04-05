class Global {
    static context = new Array()
    static bindText(elem, callback) {
        this.context.push(() => elem.textContent = callback())
        callback()
        this.context.pop()
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
                if (!subscribers.has(k)) subscribers.set(k, new Set())
                const callbacks = subscribers.get(k) 
                callbacks.add(callback(callbacks.delete))
            }
            return target[key];
        },
        set(target, key, value) {
            if (typeof value === 'object')
                    value = observable(value, [..._base, key]);
                target[key] = value
                const k = [..._base, key]
                if (subscribers.has(k))
                    subscribers.get(k).forEach(callback => callback())
                return value;
        },
    });
};


