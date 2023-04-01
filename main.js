import compiler from './compiler.js';

// console.dir(compiler.toString());
compiler({inputFileName: "./index.svelte", outputFileName: "./output.json"})
