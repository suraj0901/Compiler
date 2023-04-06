<script>
  let count = 2;
  let numbers = []
  const increment = () => ++count;
  const decrement = () => --count;
  const addNumber = () => numbers.push(numbers.length+1)
  const removeNumber = () => numbers.pop()
  $:{
    console.log({count, numbers})
  }
  let double 
  $:double= count*2
  let sum
  $:sum = numbers.reduce((a,b) => a+b, 0)
</script>

<button on:click={removeNumber}>Remove Number</button>
<p>{numbers.join("+")} = {sum}</p>
<button on:click={addNumber}>Add numbers</button>

{#each Array(20).fill(0) as a,id}
  <p>{id}</p>
  <button on:click={decrement}>Decrement</button>
  <h3>Count is {count}</h3>
  <p>{count} * 2 = {double}</p>
  <button on:click={increment}>Increment</button>
{/each}
