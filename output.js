export const client = () => {
        let count = window._runtime$.$$(10);
const increment = () => ++count.val;
const decrement = () => --count.val;
let double = () => count.val * 2;
        return (_el$) =>{
	Array(100).fill(0).forEach((a, id) => {

	window._runtime$.bindText(_el$.children[id*5+0].childNodes[0], () => id); 
	_el$.children[id*5+1].$$click=decrement;
	window._runtime$.bindText(_el$.children[id*5+2].childNodes[1], () => count.val); 
	window._runtime$.bindText(_el$.children[id*5+3].childNodes[0], () => count.val); 
	window._runtime$.bindText(_el$.children[id*5+3].childNodes[2], () => double()); 
	_el$.children[id*5+4].$$click=increment;
	
})
}
      }
export const server = () => {
        let count = 10;
const increment = () => ++count;
const decrement = () => --count;
let double = count * 2;
        return `${Array(100).fill(0).map((a, id) => `<h2 ><span>${id}</span></h2><button >Decrement</button><h3 >Count is <span>${count}</span></h3><p ><span>${count}</span> * 2 = <span>${double}</span></p><button >Increment</button>`).join("")}`
      }