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
      //1 常数
      "\\e": "\\mathrm{e}",//自然对数
      "\\i": "\\mathrm{i}",//虚数单位
      //2 代表符
      "\\Q": "\\mathbb{Q}",//有理数集合
      "\\C": "\\Complex",//复数集合
      "\\empty": "\\varnothing",//空集//替换//原\empty为\emptyset
      "\\circle": "\\odot",//圆
      "\\circled": "\\textcircled{\\footnotesize\\text{#1}}",//圆圈
      "\\Forall": "\\operatornamewithlimits{\\Large\\forall}_{#1}",//大全称量词
      "\\Exists": "\\operatornamewithlimits{\\Large\\exists}_{#1}",//大存在量词
      //3 运算符
      "\\d": "\\mathop{}\\!\\mathrm{d}",//微分符号
      "\\pd": "\\mathop{}\\!\\partial",//偏微分符号
      "\\as": "\\bigg\\vert",//代入符号
      "\\combination": "\\operatorname{C}",//组合符号
      "\\rank": "\\operatorname{r}",//秩
      "\\trace": "\\operatorname{tr}",//迹
      "\\grad": "\\boldsymbol{\\nabla}",//梯度
      "\\span": "\\operatorname{span}",//向量空间
      "\\dim": "\\operatorname{dim}",//维数
      "\\real": "\\mathord{\\char\"211c}",//原\real
      "\\Re": "\\operatorname{Re}",//实数部分//替换//原\Re为\real
      "\\image": "\\mathord{\\char\"2111}",//原\image
      "\\Im": "\\operatorname{Im}",//虚数部分//替换//原\Im为\image
      "\\le": "\\leqslant",//小于等于//替换//原\le为\leq
      "\\ge": "\\geqslant",//大于等于//替换//原\ge为\geq
      "\\nle": "\\nleqslant",//不小于等于
      "\\nge": "\\ngeqslant",//不大于等于
      "\\nl": "\\nless",//不小于
      "\\ng": "\\ngtr",//不大于
      //4 关系符
      // "\\par": "\\mathrel{/\\kern-5mu/}",//平行
      // "\\npar": "\\mathrel{/\\kern-13mu\\smallsetminus\\kern-13mu/}",//不平行
      // "\\nimplies": "\\mathrel{\\kern13mu\\not\\kern-13mu\\implies}",//无法推出
      // "\\nimpliedby": "\\mathrel{\\kern13mu\\not\\kern-13mu\\impliedby}",//无法被推出
      // "\\niff": "\\mathrel{\\kern13mu\\not\\kern-13mu\\iff}",//不等价
      // 若不可用则使用下列宏
      "\\par": "/\\kern-5mu/",//平行
      "\\npar": "/\\kern-13mu\\smallsetminus\\kern-13mu/",//不平行
      "\\nimplies": "\\kern13mu\\not\\kern-13mu\\implies",//无法推出
      "\\nimpliedby": "\\kern13mu\\not\\kern-13mu\\impliedby",//无法被推出
      "\\niff": "\\kern13mu\\not\\kern-13mu\\iff",//不等价
      //5 函数
      "\\arccot": "\\operatorname{arccot}",//反余切函数
      "\\arsinh": "\\operatorname{arsinh}",//反双曲正弦函数
      "\\arcosh": "\\operatorname{arcosh}",//反双曲余弦函数
      "\\artanh": "\\operatorname{artanh}",//反双曲正切函数
      "\\arcoth": "\\operatorname{arcoth}",//反双曲余切函数
      //6 特殊
      "\\ssd": "{\\mathrm{\\degree\\kern-0.2em C}}",//摄氏度
      "\\hsd": "{\\mathrm{\\degree\\kern-0.2em F}}",//华氏度
      //7 旧项（如有依赖则取消注释）
      "\\env": "\\begin{#1}#2\\end{#1}",//环境
      "\\envo": "\\begin{#1}{#2}#3\\end{#1}",//环境+选项
      // "\\pe": "\\kern-0.023em\\boxed{\\uparrow\\downarrow}\\kern-0.023em",//电子对
      // "\\npe": "\\kern-0.023em\\boxed{\\uparrow\\uparrow}\\kern-0.023em",//错误电子对
      // "\\nnpe": "\\kern-0.023em\\boxed{\\downarrow\\downarrow}\\kern-0.023em",//错误电子对
      // "\\se": "\\kern-0.023em\\boxed{\\kern0.25em\\uparrow\\kern0.25em}\\kern-0.023em",//单电子
      // "\\nse": "\\kern-0.023em\\boxed{\\kern0.25em\\downarrow\\kern0.25em}\\kern-0.023em",//单电子
      // "\\oe": "\\kern-0.023em\\boxed{\\kern0.25em\\phantom\\uparrow\\kern0.25em}\\kern-0.023em",//空电子
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
    str = str.replace(/<span class="cloze" data-cloze=".*?" data-ordinal="\d+">|<[\/]?span[^>]*>/gi, "")
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
