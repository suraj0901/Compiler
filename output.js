export const client = () => {
      let count = window._runtime$.$$(0);
const increment = () => ++count.val;
const decrement = () => --count.val;
      return (_el$) =>{
	_el$.children[0].$$click=decrement;
	window._runtime$.bindText(_el$.children[1].childNodes[1], () => count.val); 
	window._runtime$.bindText(_el$.children[2].childNodes[0], () => count.val); 
	window._runtime$.bindText(_el$.children[2].childNodes[2], () => count.val * 2); 
	_el$.children[3].$$click=increment;
}
    }
export const server = () => {
      let count = 0;
const increment = () => ++count;
const decrement = () => --count;
      return `<button >Decrement</button><h3 >Count is <span>${count}</span></h3><p ><span>${count}</span> * 2 = <span>${count * 2}</span></p><button >Increment</button>`
    }