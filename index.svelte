<script>
  let count = 0;
  const increment = () => {
    ++count
    console.log({count})
  };
  const decrement = () => --count;
</script>

<button on:click={decrement}>Decrement</button>
<h3>Count is {count}</h3>
<p>{count} * 2 = {count * 2}</p>
<button on:click={increment}>Increment</button>
