import { walk } from "estree-walker";
import * as codegen from "escodegen";

export const event = new Set();

function generate(ast) {
  const code = {
    client: [],
  };
  const changeVariableName = new Set();
  const reactiveStatement = new Set();
  const clientSideCode = clientScript(ast.script);

  function traverse(node, currentRef) {
    if (!node) return;
    if (Array.isArray(node)) {
      return node
        .map((html, index) =>
          traverse(html, `${currentRef}.children[${index}]`)
        )
        .join("");
    }
    switch (node.type) {
      case "EachBlock": {
        const index = node.index ?? "index";

        code.client.push(
          `${clientScript(node.expression)}.forEach((${clientScript(
            node.context
          )}, ${index}) => {\n`
        );

        const children = node.children
          .map((children, id) => {
            const ref =
              currentRef.slice(0, -1) +
              `+ ${index}*${node.children.length}+${id}` +
              currentRef.slice(-1);
            return traverse(children, ref);
          })
          .join("");

        code.client.push("\n})");

        return `\${${codegen.generate(node.expression)}.map((${
          node.context.name
        }, ${index}) => \`${children}\`).join("")}`;
      }
      case "Element": {
        let tag = `<${node.name} `;
        const attr = node.attributes.map((attribute) =>
          traverse(attribute, currentRef)
        );
        tag += attr.join(" ");
        if (node.selfClosing) return tag + "/>";
        tag += ">";
        const children = node.children.map((children, index) => {
          return traverse(children, `${currentRef}.childNodes[${index}]`);
        });
        tag += children.join("") + `</${node.name}>`;
        return tag;
      }
      case "Attribute": {
        let attribute = "";
        if (node.name.startsWith("on:")) {
          code.client.push(
            `${currentRef}.$$${node.name.slice(3)}=${clientScript(
              node.value.expression
            )};`
          );
          event.add(`"${node.name.slice(3)}"`);
        } else if (node.value.type === "Expression") {
          const ex = clientScript(node.expression);
          code.client.push(
            `window._runtime$.bindAttr(${currentRef},"${node.name}", () => ${ex})`
          );
          attribute = `${node.name}="\${${node.value.value}}"`;
        } else {
          attribute = `${node.name}="${node.value.value}"`;
        }
        return attribute;
      }
      case "Expression": {
        const exp = clientScript(node.expression);
        code.client.push(
          `window._runtime$.bindText(${currentRef}, () => ${exp}); `
        );
        return `<span>\${${codegen.generate(node.expression)}}</span>`;
      }
      case "Text": {
        return node.value;
      }
      default: {
        throw new Error(`unexpected type of element ${JSON.stringify(node)}`);
      }
    }
  }
  function clientScript(script) {
    const s = {
      type: "ExpressionStatement",
      expression: JSON.parse(JSON.stringify(script)),
    };
    walk(s, {
      leave(node, parent, prop, index) {
        if (
          node.type === "LabeledStatement" &&
          node.body.type === "BlockStatement"
        ) {
          this.replace({
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "window._runtime$.subscribe",
            },
            arguments: [
              {
                type: "ArrowFunctionExpression",
                params: [],
                body: node.body,
              },
            ],
          });
        } else if (
          parent?.type === "LabeledStatement" &&
          parent?.label?.name === "$" &&
          prop === "body"
        ) {
          if (
            node?.type === "ExpressionStatement" &&
            node?.expression?.type === "AssignmentExpression"
          ) {
            reactiveStatement.add(node.expression.left.name);
            node.expression.right = {
              type: "ArrowFunctionExpression",
              params: [],
              body: node.expression.right,
            };
          }
        } else if (parent?.type === "VariableDeclarator" && prop === "init") {
          if (
            node?.type === "Literal" ||
            node?.type === "ArrayExpression" ||
            node?.type === "ObjectExpression"
          ) {
            changeVariableName.add(parent.id?.name);
            this.replace({
              type: "CallExpression",
              callee: {
                type: "Identifier",
                name: "window._runtime$.$$",
              },
              arguments: [node],
            });
          }
          // if (

          // ) {
          //   this.replace({
          //     type: "CallExpression",
          //     callee: {
          //       type: "Identifier",
          //       name: "window._runtime$.$",
          //     },
          //     arguments: [node],
          //   });
          // }
        } else if (
          node?.type === "Identifier" &&
          (changeVariableName.has(node.name) ||
            reactiveStatement.has(node.name))
        ) {
          if (parent?.type === "Property" && prop === "key") return;
          if (parent?.type === "Property" && prop === "value")
            parent.shorthand = false;
          if (changeVariableName.has(node.name))
            this.replace({
              type: "MemberExpression",
              object: node,
              property: {
                type: "Identifier",
                name: "val",
              },
            });
          if (reactiveStatement.has(node.name)) {
            this.replace({
              type: "CallExpression",
              callee: node,
              arguments: [],
            });
          }
        }
      },
    });
    return codegen.generate(s).slice(0, -1);
  }
  const template = traverse(ast.html, "_el$");

  if (template) {
    const client = `export const client = () => {
        ${clientSideCode}
        return (_el$) =>{\n\t${code.client.join("\n\t")}\n}
      }`;
    const server = `export const server = () => {
        ${codegen.generate(ast.script)}
        return \`${template}\`
      }`;
    return [client, server].join("\n");
  }
}

export default generate;
