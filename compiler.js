import * as acorn from 'acorn';
import * as fs from 'node:fs';
import * as codegen from 'escodegen'
const log = (value) => console.log(JSON.stringify(value, null, 2));
const event = new Set();

function parse(content) {
  let i = 0;
  const ast = {};
  ast.html = parseFragments(() => i < content.length);
  return ast;

  function parseFragments(condition) {
    const fragments = [];
    while (condition()) {
      const fragment = parseFragment();
      // log(fragment);
      if (fragment) fragments.push(fragment);
    }
    return fragments;
  }
  function parseFragment() {
    return parseScript() ?? parseElement() ?? parseExpression() ?? parseText();
  }
  function parseScript() {
    if (!match('<script>')) return null;
    eat('<script>');
    const startIndex = i;
    const endIndex = content.indexOf('</script>', i);
    const code = content.slice(startIndex, endIndex);
    ast.script = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
    i = endIndex;
    eat('</script>');
  }
  function parseElement() {
    if (!match('<')) return null;
    eat('<');
    const tagName = readWhileMatching(/[a-z0-6]/);
    const attributes = parseAttributeList();
    eat('>');
    const endTag = `</${tagName}>`;
    const element = {
      type: 'Element',
      name: tagName,
      attributes,
      children: parseFragments(() => !match(endTag)),
    };
    eat(endTag)
    return element;
  }
  function parseAttributeList() {
    skipWhiteSpaces();
    const attributes = [];
    while (!match('>')) {
      const attribute = parseAttribute();
      attributes.push(attribute);
      skipWhiteSpaces();
    }
    return attributes;
  }
  function parseAttribute() {
    const attribute = {
      type: 'Attribute',
      name: readWhileMatching(/[^=]/),
    };
    // log({attribute})
    eat('=');
    if (match('{')) {
      attribute.value = parseExpression();
    } else attribute.value = parseText();
    // log({next:attribute})
    return attribute;
  }
  function parseExpression() {
    if (!match('{')) return null;
    eat('{');
    const expression = parseJavaScript();
    eat('}');
    return {
      type: 'Expression',
      expression,
    };
  }
  function parseText() {
    const text = readWhileMatching(/[^\<\{]/);
    if (text.trim() === '') return;
    return {
      type: 'Text',
      value: text,
    };
  }

  function parseJavaScript() {
    const js = acorn.parseExpressionAt(content, i, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });

    i = js.end;
    return js;
  }

  function match(str) {
    return content.slice(i, i + str.length) === str;
  }
  function eat(str) {
    if (!match(str)) throw new Error(`Parse error : expecting "${str}"`);
    i += str.length;
  }
  function readWhileMatching(regex) {
    let startIndex = i;
    while (regex.test(content[i]) && i < content.length) {
      i++;
    }
    return content.slice(startIndex, i);
  }
  function skipWhiteSpaces() {
    readWhileMatching(/[\s\n]/);
  }
}

function generate(ast) {
  const code = {
    client: [],
  };

  function traverse(node, currentRef) {
    if (!node) return;
    if (Array.isArray(node)) {
      return node
        .map((html, index) => traverse(html, `${currentRef}.childNodes[${index}]`))
        .join(" ")
    }
    switch (node.type) {
      case 'Fragment': {
        const children = node.children.map((children, index) => {
          return traverse(children, `${currentRef}.childNodes[${index}]`);
        });
        return children.join(' ');
      }
      case 'Element': {
        let tag = `<${node.name} `;
        const attr = node.attributes.map((attribute) =>
          traverse(attribute, currentRef)
        );
        tag += attr.join(' ');
        if (node.selfClosing) return tag + '/>';
        tag += '>';
        const children = node.children.map((children, index) => {
          return traverse(children, `${currentRef}.childNodes[${index}]`);
        });
        tag += children.join('') + `</${node.name}>`;
        return tag;
      }
      case 'Attribute': {
        let attribute = '';
        if (node.name.startsWith('on:')) {
          code.client.push(
            `${currentRef}.$$${node.name.slice(3)}=${node.value.expression.name};`
          );
          event.add(`"${node.name.slice(3)}"`);
        } else if (node.value.type === 'Expression') {
          const ex = codegen.generate(node.expression)
          code.client.push(
            `window._runtime$.bindAttr(${currentRef},"${node.name}", () => ${ex})`
          );
          attribute = `${node.name}="\${${node.value.value}}"`;
        } else {
          attribute = `${node.name}="${node.value.value}"`;
        }
        return attribute;
      }
      case 'Expression': {
        const exp = codegen.generate(node.expression)
        code.client.push(
          `window._runtime$.bindText(${currentRef}, () => ${exp}); `
        );
        return `<span>\${${exp}}</span>`;
      }
      case 'Text': {
        return node.value;
      }
      default: {
        throw new Error(`unexpected type of element ${JSON.stringify(node)}`);
      }
    }
  }
  const template = traverse(ast.html, '_el$')

  if (template) {
    const script = codegen.generate(ast.script) 
    const client = `export const client = () => {
      ${script}
      return (_el$) =>{\n\t${code.client.join('\n\t')}\n}
    }`
    const server  = `export const server = () => {
      ${script}
      return \`${template}\`
    }`
    return [client, server].join('\n')
  }
}

const main = ({ inputFileName, outputFileName }) => {
  const content = fs.readFileSync(inputFileName, 'utf-8');
  const ast = parse(content);
  // const analysis = analyse(ast);
  const js = generate(ast);
  log(ast)
  // const  = JSON.stringify(ast, null, 3)
  fs.writeFileSync(outputFileName, js, 'utf-8');
  // fs.writeFileSync(outputFileName, js, 'utf-8');
};

export default main;
