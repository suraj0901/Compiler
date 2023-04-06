<script>
  let count = 10;
  const increment = () => ++count;
  const decrement = () => --count;
  let double = count*2
</script>

{#each Array(100).fill(0) as a,id}
  <h2>{id}</h2>
  <button on:click={decrement}>Decrement</button>
  <h3>Count is {count}</h3>
  <p>{count} * 2 = {double}</p>
  <button on:click={increment}>Increment</button>
{/each}
