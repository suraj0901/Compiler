import compiler from './compiler/index.js';

// console.dir(compiler.toString());
compiler({inputFileName: "./index.svelte", outputFileName: "./output.js"})
