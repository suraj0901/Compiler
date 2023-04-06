import * as fs from 'node:fs';
import parse from './parse.js';
import generate from './generate.js';
const log = (value) => console.log(JSON.stringify(value, null, 2));




const main = ({ inputFileName, outputFileName }) => {
  const content = fs.readFileSync(inputFileName, 'utf-8');
  const ast = parse(content);
  // const analysis = analyse(ast);
  const js = generate(ast);
  // log(ast)
  // const js = JSON.stringify(ast, null, 3)
  // fs.writeFileSync("./output.json", js, 'utf-8');
  fs.writeFileSync(outputFileName, js, 'utf-8');
};

export default main;
