import * as acorn from 'acorn';
import * as fs from 'node:fs';

function parse(content) {
    let i = 0;
    const ast = {};
    ast.html = parseFragments(() => i < content.length)
    return ast;

    function parseFragments(condition) {
        const fragments = []
        while (condition()) {
            const fragment = parseFragment()
            if (fragment) fragments.push(fragment)
        }
        return fragments
    }
    function parseFragment() {
        return parseScript() ?? parseElement() ?? parseExpression() ?? parseText()
    }
    function parseScript() {
        if (!match('<script>')) return null
        eat("<script>")
        const startIndex = i
        const endIndex = content.indexOf("</script>", i)
        const code = content.slice(startIndex, endIndex)
        ast.script = acorn.parse(code, { ecmaVersion: "latest" })
        i = endIndex
        eat("</script>")
    }
    function parseElement() {
        if (!match('<')) return null
        eat("<")
        const tagName = readWhileMatching(/[a-z]/)
        const attributes = parseAttributeList()
        eat('>')
        const endTag = `</${tagName}>`
        const element = {
            type: "Element",
            name: tagName,
            attributes,
            children: parseFragments(() => match(endTag))
        }
        return element
    }
    function parseAttributeList() {
        skipWhiteSpaces()
        const attributes = []
        while (!match('>')) {
            const attribute = parseAttribute()
            attributes.push(attribute)
            skipWhiteSpaces()
        }
        return attributes

    }
    function parseAttribute() {
        const attribute = {
            type: "Attribute",
            name: readWhileMatching(/[^=]/)
        }
        eat("=")
        if (match("{")) {
            attribute.value = parseExpression()
        }
        else attribute.value = parseText()
        return attribute
    }
    function parseExpression() {
        if (!match("{")) return null
        eat("{")
        const expression = parseJavaScript()
        eat("}")
        return {
            type: "Expression",
            expression
        }
    }
    function parseText() {
        const text = readWhileMatching(/[^\<\{]/)
        if (text.trim() === "") return
        return {
            type: "Text",
            value: text
        }
    }

    function parseJavaScript() {
        const js = acorn.parseExpressionAt(content, i, { ecmaVersion: 2022 })
        i = js.end
        return js
    }

    function match(str) {
        return content.slice(i, i + str.length) === str
    }
    function eat(str) {
        if (!match(str)) throw new Error(`Parse error : expecting "${str}"`)
        i += str.length
    }
    function readWhileMatching(regex) {
        let startIndex = i
        while (regex.test(content[i])) {
            i++
        }
        return content.slice(startIndex, i)
    }
    function skipWhiteSpaces() {
        readWhileMatching(/[\s\n]/)
    }
}



const main = ({ inputFileName, outputFileName }) => {
    const content = fs.readFileSync(inputFileName, "utf-8")
    const ast = parse(content)
    const analysis = analyse(ast)
    const js = generate(ast, analysis)
    fs.writeFileSync(outputFileName, JSON.stringify(js, null, 3), "utf-8")
};

export default main;
