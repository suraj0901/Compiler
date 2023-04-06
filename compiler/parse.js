import * as acorn from "acorn";

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
  function parseEachFragments() {
    if (!match("{#each")) return;
    eat("{#each");
    const endExp = `{/each}`;
    const fragment = {
      type: "EachBlock",
    };
    skipWhiteSpaces();
    fragment.expression = parseJavaScript()
    skipWhiteSpaces();
    eat("as");
    skipWhiteSpaces();
    fragment.context = parseJavaScript()
    if(fragment.context.type === "SequenceExpression") {
      fragment.index = fragment.context.expressions[1].name
      fragment.context = fragment.context.expressions[0]
    }
    eat("}")
    fragment.children = parseFragments(() => !match(endExp)),
    eat(endExp);
    return fragment;
  }
  function parseFragment() {
    return (
      parseEachFragments() ??
      parseScript() ??
      parseElement() ??
      parseExpression() ??
      parseText()
    );
  }
  function parseScript() {
    if (!match("<script>")) return null;
    eat("<script>");
    const startIndex = i;
    const endIndex = content.indexOf("</script>", i);
    const code = content.slice(startIndex, endIndex);
    ast.script = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
    });
    i = endIndex;
    eat("</script>");
  }
  function parseElement() {
    if (!match("<")) return null;
    eat("<");
    const tagName = readWhileMatching(/[a-z0-6]/);
    const attributes = parseAttributeList();
    eat(">");
    const endTag = `</${tagName}>`;
    const element = {
      type: "Element",
      name: tagName,
      attributes,
      children: parseFragments(() => !match(endTag)),
    };
    eat(endTag);
    return element;
  }
  function parseAttributeList() {
    skipWhiteSpaces();
    const attributes = [];
    while (!match(">")) {
      const attribute = parseAttribute();
      attributes.push(attribute);
      skipWhiteSpaces();
    }
    return attributes;
  }
  function parseAttribute() {
    const attribute = {
      type: "Attribute",
      name: readWhileMatching(/[^=]/),
    };
    // log({attribute})
    eat("=");
    if (match("{")) {
      attribute.value = parseExpression();
    } else attribute.value = parseText();
    // log({next:attribute})
    return attribute;
  }
  function parseExpression() {
    if (!match("{")) return null;
    eat("{");
    const expression = parseJavaScript();
    eat("}");
    return {
      type: "Expression",
      expression,
    };
  }
  function parseText() {
    const text = readWhileMatching(/[^\<\{]/);
    if (text.trim() === "") return;
    return {
      type: "Text",
      value: text,
    };
  }
  function parseJavaScript() {
    const js = acorn.parseExpressionAt(content, i, {
      ecmaVersion: "latest",
      sourceType: "module",
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
  function jsScript(content) {
    return acorn.parse(content, {
      ecmaVersion: "latest",
      sourceType: "module",
    });
  }
}
export default parse;
