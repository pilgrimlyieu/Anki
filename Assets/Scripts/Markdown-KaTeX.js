var getResources = [
    getCSS("_katex.css", "https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.css"),
    getScript("_katex.js", "https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.js"),
    getScript("_markdown-it.min.js", "https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"),
    getScript("_markdown-it-mark.js", "https://github.com/markdown-it/markdown-it-mark/blob/master/dist/markdown-it-mark.js"),
    getScript("_auto-render.js", "https://cdn.jsdelivr.net/gh/Jwrede/Anki-KaTeX-Markdown/auto-render-cdn.js"),
    // getCSS("_highlight.css", "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/atom-one-dark-reasonable.min.css"),
    // getScript("_highlight.js", "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/highlight.min.js"),
];

Promise.all(getResources).then(() => getScript("_mhchem.js", "https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/contrib/mhchem.min.js")).then(render).catch(show);

function getScript(path, altURL) {
    return new Promise((resolve, reject) => {
        let script = document.createElement("script");
        script.onload = resolve;
        script.onerror = function() {
            let script_online = document.createElement("script");
            script_online.onload = resolve;
            script_online.onerror = reject;
            script_online.src = altURL;
            document.head.appendChild(script_online);
        }
        script.src = path;
        document.head.appendChild(script);
    })
}

function getCSS(path, altURL) {
    return new Promise((resolve, reject) => {
        var css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.type = 'text/css';
        css.onload = resolve;
        css.onerror = function() {
            var css_online = document.createElement('link');
            css_online.setAttribute('rel', 'stylesheet');
            css_online.type = 'text/css';
            css_online.onload = resolve;
            css.onerror = reject;
            css_online.href = altURL;
            document.head.appendChild(css_online);
        }
        css.href = path;
        document.head.appendChild(css);
    });
}

function render() {
    try {renderField("front")}  catch {}
    try {renderField("back")}   catch {}
    try {renderField("extra")}  catch {}
    try {renderField("extra1")} catch {}
    try {renderField("extra2")} catch {}
    show();
}

function renderField(field) {
    renderMath(field);
    markdown(field);
}

function show() {
    try {document.getElementById("front").style.visibility  = "visible"} catch {}
    try {document.getElementById("back").style.visibility   = "visible"} catch {}
    try {document.getElementById("extra").style.visibility  = "visible"} catch {}
    try {document.getElementById("extra1").style.visibility = "visible"} catch {}
    try {document.getElementById("extra2").style.visibility = "visible"} catch {}
}

function renderMath(ID) {
    let text = document.getElementById(ID).innerHTML;
    text = replaceInString(text);
    document.getElementById(ID).textContent = text;
    renderMathInElement(document.getElementById(ID), {
        delimiters:  [
            {left: "$$", right: "$$", display: true},
            {left: "\\[", right: "\\]", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\(", right: "\\)", display: false},
        ],
        trust: true,
        macros: {
            //1 ??????
            "\\e": "\\mathrm{e}",//????????????
            "\\i": "\\mathrm{i}",//????????????
            //2 ?????????
            "\\Q": "\\mathbb{Q}",//???????????????
            "\\C": "\\Complex",//????????????
            "\\empty": "\\varnothing",//??????//??????//???\empty???\emptyset
            "\\degree": "^\\circ",//???//???\degree??????
            "\\circle": "\\odot",//???
            "\\circled": "\\textcircled{\\footnotesize\\text{#1}}",//??????
            //3 ?????????
            "\\d": "\\mathop{}\\!\\mathrm{d}",//????????????
            "\\pd": "\\mathop{}\\!\\partial",//???????????????
            "\\as": "\\bigg\\vert",//????????????
            "\\c": "\\operatorname{C}",//????????????
            "\\Re": "\\operatorname{Re}\\left(#1\\right)",//????????????//??????//???\Re???\real
            "\\Im": "\\operatorname{Im}\\left(#1\\right)",//????????????//??????//???\Im???\image
            "\\le": "\\leqslant",//????????????//??????//???\le???\leq
            "\\ge": "\\geqslant",//????????????//??????//???\ge???\geq
            "\\nle": "\\nleqslant",//???????????????
            "\\nge": "\\ngeqslant",//???????????????
            "\\nl": "\\nless",//?????????
            "\\ng": "\\ngtr",//?????????
            //4 ?????????
            "\\par": "\\mathbin{/\\negmedspace/}",//??????
            //"\\npar": "\\mathbin{/\\negthickspace\\negmedspace\\negmedspace\\smallsetminus\\negthickspace   \\negmedspace\\negmedspace/}",//?????????
            "\\npar": "\\:\\!\\diagdown\\kern-1.25em\\par\\:\\!",//???AnkiDroid???????????????
            //5 ?????????
            //"\\vec":"\\overrightarrow{#1}",//??????//??????//???\vec??????
            //"\\bar":"\\overline{#1}",//?????????//??????//???\bar??????
            //6 ??????
            "\\arsinh": "\\operatorname{arsinh}",//?????????????????????
            "\\arcosh": "\\operatorname{arcosh}",//?????????????????????
            "\\artanh": "\\operatorname{artanh}",//?????????????????????
            "\\arcoth": "\\operatorname{arcoth}",//?????????????????????
            //7 ??????
            "\\env": "\\begin{#1}#2\\end{#1}",//??????
            "\\envo": "\\begin{#1}{#2}#3\\end{#1}",//??????+??????
            //8 ????????????
            "\\Anki": "\\mathcal{A}\\bm{n}\\mathrm{k}\\mathtt{i}",//Anki
            "\\AnkiDroid": "\\mathcal{A}\\bm{n}\\mathrm{k}\\mathtt{i}\\mathbb{D}r\\mathbf{o}\\mathfrak{i}\\mathsf{d}",//AnkiDroid
            "\\GeoGebra": "\\mathbb{G}\\mathrm{e}\\mathbf{o}\\mathcal{G}\\mathscr{e}\\mathsf{b}\\mathfrak{r}a",//GeoGebra
            "\\Markdown": "\\mathcal{M}\\mathbf{a}\\mathfrak{r}\\bm{k}\\mathscr{D}\\mathrm{o}w\\mathtt{d}",//MarkDown
            //9 ??????
            ////I ??????
            //////??? ???????????????
            //"\\pe": "\\kern-0.023em\\boxed{\\uparrow\\downarrow}\\kern-0.023em",//?????????
            //"\\npe": "\\kern-0.023em\\boxed{\\uparrow\\uparrow}\\kern-0.023em",//???????????????
            //"\\nnpe": "\\kern-0.023em\\boxed{\\downarrow\\downarrow}\\kern-0.023em",//???????????????
            //"\\se": "\\kern-0.023em\\boxed{\\kern0.25em\\uparrow\\kern0.25em}\\kern-0.023em",//?????????
            //"\\nse": "\\kern-0.023em\\boxed{\\kern0.25em\\downarrow\\kern0.25em}\\kern-0.023em",//?????????
            //"\\oe": "\\kern-0.023em\\boxed{\\kern0.25em\\phantom\\uparrow\\kern0.25em}\\kern-0.023em",//?????????
            "\\pe": "\\kern-0.028em\\boxed{\\uparrow\\downarrow}\\kern-0.028em",//????????????AnkiDroid??????
            "\\npe": "\\kern-0.028em\\boxed{\\uparrow\\uparrow}\\kern-0.028em",//??????????????????AnkiDroid??????
            "\\nnpe": "\\kern-0.028em\\boxed{\\downarrow\\downarrow}\\kern-0.028em",//??????????????????AnkiDroid??????
            "\\se": "\\kern-0.028em\\boxed{\\kern0.25em\\uparrow\\kern0.25em}\\kern-0.028em",//????????????AnkiDroid??????
            "\\nse": "\\kern-0.028em\\boxed{\\kern0.25em\\downarrow\\kern0.25em}\\kern-0.028em",//????????????AnkiDroid??????
            "\\oe": "\\kern-0.028em\\boxed{\\kern0.25em\\phantom\\uparrow\\kern0.25em}\\kern-0.028em",//????????????AnkiDroid??????
            ////II ??????
            "\\ssd": "{\\!\\mathrm{\\normalsize\\raisebox{0.1em}{\\(\\degree\\)}\\kern-0.1em C}}",//?????????
            "\\hsd": "{\\!\\mathrm{\\normalsize\\raisebox{0.1em}{\\(\\degree\\)}\\kern-0.1em F}}",//?????????
        },
        throwOnError: false
    });
}

function markdown(ID) {
    // let md = new markdownit({typographer: true, html: true, highlight: function (str, lang) {
    //     if (lang && hljs.getLanguage(lang)) {
    //         try {
    //             return hljs.highlight(str, { language: lang }).value;
    //         } catch (__) {}
    //     }
    //     return ''; // use external default escaping
    // }}).use(markdownItMark);
    let md = new markdownit({typographer: true, html: true}).use(markdownItMark);
    let text = replaceHTMLElementsInString(document.getElementById(ID).innerHTML);
    text = md.render(text);
    document.getElementById(ID).innerHTML = text.replace(/&lt;\/span&gt;/gi, "\\");
}
function replaceInString(str) {
    str = str.replace(/<[\/]?pre[^>]*>/gi, "");
    str = str.replace(/<br\s*[\/]?[^>]*>/gi, "\n");
    str = str.replace(/<div[^>]*>/gi, "\n");
    str = str.replace(/<[\/]?span[^>]*>/gi, "")
    str = str.replace(/<\/div[^>]*>/gi, "\n");
    str = str.replace(/&nbsp;/gi, " ");
    return replaceHTMLElementsInString(str);
}

function replaceHTMLElementsInString(str) {
    str = str.replace(/&tab;/gi, "  ");
    str = str.replace(/&gt;/gi, ">");
    str = str.replace(/&lt;/gi, "<");
    return str.replace(/&amp;/gi, "&");
}
