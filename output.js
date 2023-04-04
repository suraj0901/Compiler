export const client = () => {
    let count = 0;
    const increment = () => ++count;
    const decrement = () => --count;
    return (_el$) => {
        _el$.childNodes[0].$$click = decrement;
        window._runtime$.bindText(_el$.childNodes[1].childNodes[1], () => count);
        window._runtime$.bindText(_el$.childNodes[2].childNodes[0], () => count);
        window._runtime$.bindText(_el$.childNodes[2].childNodes[2], () => count * 2);
        _el$.childNodes[3].$$click = increment;
    }
}

export const server = () => {
    let count = 0;
    const increment = () => ++count;
    const decrement = () => --count;
    return `<button >Decrement</button> <h3 >Count is <span>${count}</span></h3> <p ><span>${count}</span> * 2 = <span>${count * 2}</span></p> <button >Increment</button>`
}