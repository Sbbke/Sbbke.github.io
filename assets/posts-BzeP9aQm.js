const a=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    hello
</body>
</html>`;function s(t){return t.replace(/^\d{4}-\d{2}-\d{2}-/,"").split("-").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function o(t){return t.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1]}const l=Object.assign({"/posts/temp.html":a});async function c(t){const e=`/posts/${t}.html`,n=l[e];if(n==null)throw new Response(null,{status:404});return{slug:t,title:s(t),date:o(t),html:n}}async function i(){return Object.keys(l).map(e=>{const n=e.replace(/^\/posts\//,"").replace(/\.html$/,"");return{slug:n,title:s(n),date:o(n)}}).sort((e,n)=>(n.date??"0000-00-00").localeCompare(e.date??"0000-00-00"))}export{i as a,c as g};
