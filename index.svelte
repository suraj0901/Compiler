<script>
  let count = 0;
  const increment = () => ++count;
  const decrement = () => --count;  
</script>

<button on:click={decrement}>Decrement</button>
<h3>Count is {count}</h3>
<button on:click={increment}>Increment</button>

