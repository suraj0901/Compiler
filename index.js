const indexHTML = (content) => `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Svolid</title>
    <script type="module">
        import client from "./runtime.js"
        import {Global} from "./lib.js"
        window._runtime$ = Global
        const body = document.getElementsByTagName('body')[0]
        client()(body)
        window.addEventListener("click", ({target}) => {
            target["$$click"]?.()
        })
    </script>
</head>
<body>
    ${content}
</body>

</html>`

export default indexHTML