/**
 * @fileoverview Anki Markdown + KaTeX Renderer.
 * Loads necessary resources (local first, CDN fallback) and renders specified fields.
 * Handles NESTED Cloze within KaTeX using DOM-based placeholders.
 * Place this file and all local resources (files starting with '_') in Anki's `collection.media` folder.
 * @author PilgrimLyieu
 * @email pilgrimlyieu@outlook.com
 * @github https://github.com/pilgrimlyieu/Anki/blob/main/collection.media/_Anki-Markdown.js
 */
(function () {
  "use strict";

  // --- Configuration ---

  const config = {
    /** @type {string[]} Field IDs to render */
    fieldIds: ["front", "back", "extra", "extra1", "extra2"],

    /** @type {string[]} Field IDs that might contain Cloze deletions and need placeholder processing. */
    clozeFieldIds: ["front", "back"],

    /** @type {object[]} List of resources to load */
    resources: [
      // CSS
      {
        type: "css",
        name: "katex",
        local: "_katex.css",
        cdn: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
      },
      {
        type: "css",
        name: "highlight",
        local: "_highlight.min.css",
        cdn: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark-reasonable.min.css",
      },

      // Core JS Libraries (Order matters for dependencies)
      {
        type: "script",
        name: "katex",
        local: "_katex.js",
        cdn: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js",
      },
      {
        type: "script",
        name: "katexAutoRender",
        local: "_auto-render.js",
        cdn: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js",
        dependsOn: "katex",
      },
      {
        type: "script",
        name: "markdownit",
        local: "_markdown-it.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js",
      },
      {
        type: "script",
        name: "highlight",
        local: "_highlight.min.js",
        cdn: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
      },

      // KaTeX Extensions (Load after KaTeX core)
      {
        type: "script",
        name: "mhchem",
        local: "_mhchem.js",
        cdn: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js",
        dependsOn: "katex",
      },

      // Markdown-it Plugins
      {
        type: "script",
        name: "markdownitMark",
        pluginName: "markdownitMark",
        local: "_markdown-it-mark.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/markdown-it-mark@4.0.0/dist/markdown-it-mark.min.js",
        isPlugin: true,
        dependsOn: "markdownit",
      },
      {
        type: "script",
        name: "markdownitFootnote",
        pluginName: "markdownitFootnote",
        local: "_markdown-it-footnote.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js",
        isPlugin: true,
        dependsOn: "markdownit",
      },

      // Mermaid
      {
        type: "script",
        name: "mermaid",
        local: "_mermaid.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js",
      },
    ],

    /** KaTeX auto-render options */
    katexOptions: {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      trust: true,
      strict: "ignore",
      macros: {
        //1 常数
        "\\e": "\\mathrm{e}", //自然对数
        "\\i": "\\mathrm{i}", //虚数单位
        //2 代表符
        "\\Q": "\\mathbb{Q}", //有理数集合
        "\\C": "\\Complex", //复数集合
        "\\empty": "\\varnothing", //空集//替换//原\empty为\emptyset
        "\\circle": "\\odot", //圆
        "\\circled": "\\textcircled{\\footnotesize\\text{#1}}", //圆圈
        "\\Forall": "\\operatornamewithlimits{\\Large\\forall}_{#1}", //大全称量词
        "\\Exists": "\\operatornamewithlimits{\\Large\\exists}_{#1}", //大存在量词
        //3 运算符
        "\\d": "\\mathop{}\\!\\mathrm{d}", //微分符号
        "\\pd": "\\mathop{}\\!\\partial", //偏微分符号
        "\\as": "\\bigg\\vert", //代入符号
        "\\combination": "\\operatorname{C}", //组合符号
        "\\rank": "\\operatorname{r}", //秩
        "\\trace": "\\operatorname{tr}", //迹
        "\\grad": "\\boldsymbol{\\nabla}", //梯度
        "\\span": "\\operatorname{span}", //向量空间
        "\\dim": "\\operatorname{dim}", //维数
        "\\real": '\\mathord{\\char"211c}', //原\real
        "\\Re": "\\operatorname{Re}", //实数部分//替换//原\Re为\real
        "\\image": '\\mathord{\\char"2111}', //原\image
        "\\Im": "\\operatorname{Im}", //虚数部分//替换//原\Im为\image
        "\\le": "\\leqslant", //小于等于//替换//原\le为\leq
        "\\ge": "\\geqslant", //大于等于//替换//原\ge为\geq
        "\\nle": "\\nleqslant", //不小于等于
        "\\nge": "\\ngeqslant", //不大于等于
        "\\nl": "\\nless", //不小于
        "\\ng": "\\ngtr", //不大于
        //4 关系符
        // "\\par": "\\mathrel{/\\kern-5mu/}",//平行
        // "\\npar": "\\mathrel{/\\kern-13mu\\smallsetminus\\kern-13mu/}",//不平行
        // "\\nimplies": "\\mathrel{\\kern13mu\\not\\kern-13mu\\implies}",//无法推出
        // "\\nimpliedby": "\\mathrel{\\kern13mu\\not\\kern-13mu\\impliedby}",//无法被推出
        // "\\niff": "\\mathrel{\\kern13mu\\not\\kern-13mu\\iff}",//不等价
        // 若不可用则使用下列宏
        "\\par": "/\\kern-5mu/", //平行
        "\\npar": "/\\kern-13mu\\smallsetminus\\kern-13mu/", //不平行
        "\\nimplies": "\\kern13mu\\not\\kern-13mu\\implies", //无法推出
        "\\nimpliedby": "\\kern13mu\\not\\kern-13mu\\impliedby", //无法被推出
        "\\niff": "\\kern13mu\\not\\kern-13mu\\iff", //不等价
        //5 函数
        "\\arccot": "\\operatorname{arccot}", //反余切函数
        "\\arsinh": "\\operatorname{arsinh}", //反双曲正弦函数
        "\\arcosh": "\\operatorname{arcosh}", //反双曲余弦函数
        "\\artanh": "\\operatorname{artanh}", //反双曲正切函数
        "\\arcoth": "\\operatorname{arcoth}", //反双曲余切函数
        //6 特殊
        "\\ssd": "{\\mathrm{\\degree\\kern-0.2em C}}", //摄氏度
        "\\hsd": "{\\mathrm{\\degree\\kern-0.2em F}}", //华氏度
        //7 旧项（如有依赖则取消注释）
        "\\env": "\\begin{#1}#2\\end{#1}", //环境
        "\\envo": "\\begin{#1}{#2}#3\\end{#1}", //环境+选项
        // "\\pe": "\\kern-0.023em\\boxed{\\uparrow\\downarrow}\\kern-0.023em",//电子对
        // "\\npe": "\\kern-0.023em\\boxed{\\uparrow\\uparrow}\\kern-0.023em",//错误电子对
        // "\\nnpe": "\\kern-0.023em\\boxed{\\downarrow\\downarrow}\\kern-0.023em",//错误电子对
        // "\\se": "\\kern-0.023em\\boxed{\\kern0.25em\\uparrow\\kern0.25em}\\kern-0.023em",//单电子
        // "\\nse": "\\kern-0.023em\\boxed{\\kern0.25em\\downarrow\\kern0.25em}\\kern-0.023em",//单电子
        // "\\oe": "\\kern-0.023em\\boxed{\\kern0.25em\\phantom\\uparrow\\kern0.25em}\\kern-0.023em",//空电子
        //8 公式引用
        "\\eqref": "\\href{##label-#1}{(\\text{#1})}",
        "\\ref": "\\href{##label-#1}{\\text{#1}}",
        "\\label": "\\htmlId{label-#1}{}",
      },
      throwOnError: false,
    },

    /** Markdown-it options */
    markdownOptions: {
      html: true, // Enable HTML tags in source
      xhtmlOut: false, // Don't use '/' in single tags (<br />)
      breaks: true, // Convert '\n' in paragraphs into <br>
      linkify: true, // Autoconvert URL-like text to links
      typographer: true, // Enable smartypants and other typographic replacements
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre class="hljs"><code>' +
              hljs.highlight(str, { language: lang, ignoreIllegals: true })
                .value +
              "</code></pre>"
            );
          } catch (__) {}
        } else if (lang === "mermaid") {
          // Handle mermaid blocks specifically for the plugin
          const escapedStr = str;
          return `<pre class="mermaid">${escapedStr}</pre>`;
        }
        // Use external default escaping
        const escaped = md
          ? md.utils.escapeHtml(str)
          : str.replace(/</g, "<").replace(/>/g, ">");
        return '<pre class="hljs"><code>' + escaped + "</code></pre>";
      },
    },

    /** Mermaid options */
    mermaidOptions: {
      theme: "dark",
      startOnLoad: false,
    },
  };

  // --- State ---

  /** @type {boolean} Flag to prevent multiple initializations */
  let isInitialized = false;
  /** @type {object | null} The initialized markdown-it instance */
  let md = null;
  /** @type {object} Stores loaded plugin functions { pluginName: function } */
  const loadedPlugins = {};
  /** @type {Set<string>} Set of successfully loaded libraries */
  const loadedLibraries = new Set();
  /** @type {object} Stores cloze placeholder data { index: { tagName, attributes } } */
  let clozePlaceholdersData = {};
  /** @type {number} Counter for cloze placeholders */
  let clozeCounter = 0;

  // --- Core Logic ---

  /**
   * Logs an error message to the console.
   * @param {string} message The error message.
   * @param {*} [error] Optional error object or details.
   */
  function logError(message, error) {
    console.error(
      `AnkiMarkdown Error: ${message}`,
      error ?? "No details provided."
    );
  }

  /**
   * Loads a CSS or JavaScript resource.
   * Tries local path first, falls back to CDN URL.
   * Resolves on successful load or non-critical failure (e.g., network error).
   * Rejects if a required dependency ('dependsOn') is not loaded.
   * @param {object} resource - The resource object from config.resources.
   * @returns {Promise<Function|void>} Resolves with the plugin function if it's a plugin, otherwise void. Rejects on critical failure (missing dependency).
   */
  function loadResource(resource) {
    return new Promise((resolve, reject) => {
      // --- Strict Dependency Check ---
      if (resource.dependsOn) {
        // Check if the dependency name is in our set of successfully loaded libs
        if (!loadedLibraries.has(resource.dependsOn)) {
          const errorMsg = `${resource.name} depends on ${resource.dependsOn}, which has not been loaded successfully. Skipping load.`;
          logError(errorMsg);
          return reject(new Error(errorMsg)); // Reject promise for this resource
        }
      }

      // If it's a plugin, check if it's already loaded/defined globally
      if (
        resource.isPlugin &&
        resource.pluginName &&
        window[resource.pluginName]
      ) {
        // console.log(`Plugin ${resource.pluginName} already defined.`);
        if (!loadedPlugins[resource.pluginName]) {
          loadedPlugins[resource.pluginName] = window[resource.pluginName];
        }
        loadedLibraries.add(resource.name); // Mark as loaded
        return resolve(window[resource.pluginName]);
      }

      const load = (url, isLocal) => {
        // console.log(`Attempting to load ${resource.name} from ${isLocal ? 'local' : 'CDN'}: ${url}`);
        let element;
        if (resource.type === "css") {
          element = document.createElement("link");
          element.rel = "stylesheet";
          element.type = "text/css";
          element.href = url;
        } else {
          element = document.createElement("script");
          element.src = url;
        }

        element.onload = () => {
          // console.log(`Successfully loaded ${resource.name} from ${isLocal ? 'local' : 'CDN'}`);
          loadedLibraries.add(resource.name); // Add to set of loaded libs

          if (resource.isPlugin && resource.pluginName) {
            if (window[resource.pluginName]) {
              loadedPlugins[resource.pluginName] = window[resource.pluginName];
              resolve(window[resource.pluginName]);
            } else {
              // Plugin script loaded, but function not found globally. This is an issue.
              const errorMsg = `Plugin ${resource.pluginName} script loaded but function not found globally.`;
              logError(errorMsg);
              // Resolve anyway, but initialization might fail later if plugin is crucial
              resolve();
            }
          } else {
            resolve(); // Resolve for non-plugin resources
          }
        };

        element.onerror = () => {
          console.warn(
            `Failed to load ${resource.name} from ${
              isLocal ? "local" : "CDN"
            }: ${url}`
          );
          if (element.parentNode) element.parentNode.removeChild(element);

          if (isLocal && resource.cdn && resource.cdn !== "SKIP") {
            load(resource.cdn, false); // Try CDN
          } else {
            // Failed from both local and CDN, or no CDN fallback
            logError(`Failed to load ${resource.name} from all sources.`);
            // Resolve anyway to not break the entire chain for non-critical resources
            // The dependency check should prevent dependent libs from loading.
            resolve();
          }
        };
        document.head.appendChild(element);
      };

      load(resource.local, true); // Start with local path
    });
  }

  /**
   * Initializes libraries (Markdown-it, Mermaid) after resources are loaded.
   * @returns {Promise<void>} Resolves when libraries are initialized or if non-critical parts fail.
   */
  function initializeLibs() {
    return new Promise((resolve, reject) => {
      // Use reject here, initialization is critical
      try {
        // --- Initialize Markdown-it ---
        if (typeof markdownit === "undefined") {
          return reject(
            new Error("markdown-it library failed to load. Cannot proceed.")
          );
        }
        // Check if already initialized (e.g., during re-render)
        if (!md) {
          md = window.markdownit(config.markdownOptions);
          console.log("Markdown-it initialized.");

          // Add markdown-it plugins that were successfully loaded
          config.resources.forEach((res) => {
            if (res.isPlugin && res.pluginName) {
              const pluginFunc =
                loadedPlugins[res.pluginName] || window[res.pluginName]; // Check both places
              if (pluginFunc) {
                try {
                  if (!loadedPlugins[res.pluginName])
                    loadedPlugins[res.pluginName] = pluginFunc;
                  md.use(pluginFunc);
                  console.log(
                    `Registered markdown-it plugin: ${res.pluginName}`
                  );
                } catch (pluginError) {
                  logError(
                    `Failed to use markdown-it plugin ${res.pluginName}`,
                    pluginError
                  );
                  // Optionally reject if a critical plugin fails? For now, just log.
                }
              } else {
                // Only warn if the plugin was expected but not found
                if (loadedLibraries.has(res.name)) {
                  // Check if script *tried* to load
                  console.warn(
                    `Markdown-it plugin ${res.pluginName} loaded but function unavailable.`
                  );
                } else {
                  console.warn(
                    `Markdown-it plugin ${res.pluginName} script not loaded.`
                  );
                }
              }
            }
          });
        } else {
          console.log("Markdown-it already initialized.");
        }

        // --- Initialize Mermaid ---
        if (typeof mermaid === "undefined") {
          // Log error but don't reject, Mermaid might be optional
          logError(
            "Mermaid library not loaded. Skipping Mermaid initialization."
          );
        } else {
          try {
            // Check if Mermaid is already initialized (less common, but possible)
            // Mermaid doesn't have a simple check like `mermaid.isInitialized`
            // Re-initializing is usually safe if needed.
            mermaid.initialize(config.mermaidOptions);
            console.log("Mermaid initialized.");
          } catch (mermaidInitError) {
            logError("Failed to initialize Mermaid", mermaidInitError);
            // Don't reject, allow rendering to continue without Mermaid
          }
        }

        // --- Check Highlight.js ---
        if (typeof hljs === "undefined") {
          // Log error but don't reject, highlighting might be optional
          logError(
            "Highlight.js library not loaded. Code highlighting might not work."
          );
        } else {
          console.log("Highlight.js ready.");
        }

        resolve(); // Initialization successful or non-critical parts failed
      } catch (initError) {
        logError("Critical error during library initialization", initError);
        reject(initError); // Reject if core initialization fails (like markdown-it)
      }
    });
  }

  // --- Cloze Processing Functions (DOM-based Preprocessing, String-based Restoration) ---

  /**
   * Decodes HTML entities in a string.
   * @param {string} text - The string to decode.
   * @returns {string} The decoded string.
   */
  function decodeHTMLEntities(text) {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
  }

  /**
   * Processes a DOM node recursively to replace cloze spans with placeholders.
   * @param {Node} node - The DOM node to process.
   */
  function processNodeForCloze(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        processNodeForCloze(child);
      }
    }
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      node.matches("span.cloze, span.cloze-inactive")
    ) {
      clozeCounter++;
      const index = clozeCounter;
      const attributes = {};
      for (const attr of node.attributes) {
        attributes[attr.name] = attr.value;
      }
      clozePlaceholdersData[index] = {
        tagName: node.tagName.toLowerCase(),
        attributes: attributes,
      };
      const startMarker = document.createTextNode(`⛶${index}🄀`);
      const endMarker = document.createTextNode(`⛿${index}🄀`);
      const fragment = document.createDocumentFragment();
      while (node.firstChild) {
        fragment.appendChild(node.firstChild);
      }
      node.parentNode.insertBefore(startMarker, node);
      node.parentNode.insertBefore(fragment, node);
      node.parentNode.insertBefore(endMarker, node);
      node.parentNode.removeChild(node);
      // console.log(`Cloze Placeholder: Replaced span index ${index}`);
    }
  }

  /**
   * Preprocesses HTML content to replace cloze spans with placeholders.
   * @param {string} htmlContent - The HTML content to preprocess.
   * @returns {string} HTML content with placeholders.
   */
  function preprocessClozePlaceholdersDOM(htmlContent) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    processNodeForCloze(tempDiv);
    return tempDiv.innerHTML;
  }

  /**
   * Extracts the pure numeric digits from a string potentially containing HTML tags.
   * @param {string} str - The string containing digits and potentially tags.
   * @returns {string|null} The extracted digits as a string, or null if no digits found.
   */
  function extractDigits(str) {
    if (!str) return null;
    const match = str.match(/\d+/);
    return match ? match[0] : null;
  }

  /**
   * Restores Cloze spans from placeholders iteratively.
   * Processes strictly innermost placeholders first.
   * @param {string} htmlContent - The rendered HTML content potentially containing placeholders.
   * @returns {string} HTML content with placeholders replaced back to Cloze spans.
   */
  function restoreClozePlaceholders(htmlContent) {
    // --- Pre-processing step to remove KaTeX spans around markers ---
    // KaTeX will wrap the markers in spans with classes like "mord", "mtight", etc. like <span class="mord mtight">⛶1🄀</span>
    const katexStartMarkerWrapperRegex =
      /<span\s+class="mord(?: m[a-z]+)*"[^>]*>((?:⛶(?:(?:<span[^>]*>)?\d+(?:<\/span>)?|\d+)🄀)+)<\/span>/g;
    const katexEndMarkerWrapperRegex =
      /<span\s+class="mord(?: m[a-z]+)*"[^>]*>((?:⛿(?:(?:<span[^>]*>)?\d+(?:<\/span>)?|\d+)🄀)+)<\/span>/g;

    const innermostPlaceholderRegex =
      /⛶((?:<span[^>]*>)?\d+(?:<\/span>)?|\d+)🄀((?:(?!⛶|⛿).)*?)⛿((?:<span[^>]*>)?\d+(?:<\/span>)?|\d+)🄀/s;

    // Remove the KaTeX wrappers, leaving only the marker content
    let currentHtml = htmlContent
      .replace(katexStartMarkerWrapperRegex, "$1")
      .replace(katexEndMarkerWrapperRegex, "$1");
    let previousHtml;
    let iterations = 0;
    const maxIterations = 100; // Safety break

    do {
      previousHtml = currentHtml;
      let replacedThisIteration = false;

      // Find the first match that satisfies the "innermost" condition
      const matchResult = currentHtml.match(innermostPlaceholderRegex);

      if (matchResult) {
        const [fullMatch, startIndexPart, processedContent, endIndexPart] =
          matchResult;

        // Extract pure digits from the potentially wrapped index parts
        const numericStartIndex = extractDigits(startIndexPart);
        const numericEndIndex = extractDigits(endIndexPart);

        // --- Verify that the numeric indices match ---
        if (
          numericStartIndex !== null &&
          numericStartIndex === numericEndIndex
        ) {
          const index = parseInt(numericStartIndex, 10);
          const data = clozePlaceholdersData[index];

          if (data) {
            let attributesString = "";
            for (const name in data.attributes) {
              let escapedValue = data.attributes[name];
              if (md?.utils?.escapeHtml) {
                escapedValue = md.utils.escapeHtml(escapedValue);
              }
              attributesString += ` ${name}="${escapedValue}"`;
            }
            const restoredTag = `<${data.tagName}${attributesString}>${processedContent}</${data.tagName}>`;

            // Replace only the *first* occurrence of this valid innermost match
            currentHtml = currentHtml.replace(fullMatch, restoredTag);
            replacedThisIteration = true;
            // console.log(`Restored innermost index ${index}`);
          } else {
            logError(
              `Cloze Placeholder: No data found for innermost index ${index}. Leaving placeholder: ${fullMatch}`
            );
            // If data is missing, we didn't replace, loop will check next potential match or terminate.
          }
        }
      } else {
        // No match found in this iteration that satisfies the innermost condition
        break; // Exit loop if no innermost placeholders are left
      }

      iterations++;
      if (iterations >= maxIterations) {
        logError(
          `Cloze restoration exceeded max iterations (${maxIterations}). Aborting.`
        );
        break;
      }
      // console.log(`Iteration ${iterations} complete.`);
    } while (currentHtml !== previousHtml); // Loop until no more changes occur

    // console.log("Cloze restoration loop finished.");
    // Final check for any remaining placeholders (more robust check needed)
    const remainingPlaceholderRegex = /⛶(?:<span[^>]*>)?\d+(?:<\/span>)?|\d+🄀/;
    if (remainingPlaceholderRegex.test(currentHtml)) {
      logError(
        "Unresolved Cloze placeholders may remain after restoration loop.",
        currentHtml.substring(0, 1000)
      );
    }

    return currentHtml;
  }

  // --- Rendering Functions ---

  /**
   * Renders a single field.
   * @param {string} fieldId - The ID of the HTML element containing the field content.
   */
  function renderField(fieldId) {
    const element = document.getElementById(fieldId);
    if (!element) {
      return;
    }
    // console.log(`Rendering field "${fieldId}"...`);

    try {
      let content = element.innerHTML;
      let processedPlaceholders = false;
      console.log(`Before rendering: ${content}`);

      // --- 1. Preprocess Cloze (DOM method, only for specified fields) ---
      if (config.clozeFieldIds?.includes(fieldId)) {
        // console.log(`Preprocessing cloze placeholders (DOM) for field "${fieldId}"...`);
        content = preprocessClozePlaceholdersDOM(content);
        processedPlaceholders = true;
      }
      element.innerHTML = content; // Update the DOM with preprocessed HTML

      // --- 2. Render KaTeX ---
      if (
        typeof katex !== "undefined" &&
        typeof renderMathInElement === "function"
      ) {
        if (!element.classList.contains("katex-rendered")) {
          try {
            renderMathInElement(element, config.katexOptions);
            element.classList.add("katex-rendered");
          } catch (katexError) {
            logError(
              `KaTeX rendering failed for field "${fieldId}"`,
              katexError
            );
          }
        }
      } else {
        if (
          !loadedLibraries.has("katex") ||
          !loadedLibraries.has("katexAutoRender")
        ) {
          console.warn(
            `KaTeX libraries not loaded, skipping math rendering for field "${fieldId}".`
          );
        } else {
          logError(
            `KaTeX loaded but renderMathInElement not found for field "${fieldId}".`
          );
        }
      }
      // console.log(`After KaTeX rendering: ${element.innerHTML}`);

      // --- 3. Render Markdown ---
      if (md) {
        content = md.render(decodeHTMLEntities(element.innerHTML));
        element.innerHTML = content; // Update the DOM with rendered HTML
      } else {
        logError(
          `Markdown-it instance not available for rendering field "${fieldId}".`
        );
      }
      // console.log(`After Markdown rendering: ${element.innerHTML}`);

      // --- 4. Restore Cloze Placeholders (string method, only if preprocessed) ---
      if (processedPlaceholders) {
        // console.log(`Restoring cloze placeholders (string) for field "${fieldId}"...`);
        let finalHtml = element.innerHTML; // Read back potentially modified HTML
        // console.log(`Before restoring: ${finalHtml}`);
        finalHtml = restoreClozePlaceholders(finalHtml);
        // console.log(`After restoring: ${finalHtml}`);
        element.innerHTML = finalHtml; // Update the DOM with restored spans
      }
    } catch (renderError) {
      logError(`Failed to render field "${fieldId}"`, renderError);
      if (element) element.style.visibility = "visible"; // Ensure visibility even on error
    }
  }

  /**
   * Renders all configured fields and then triggers Mermaid rendering.
   * @returns {void}
   */
  function renderAllFields() {
    console.log("Starting field rendering cycle...");
    // Reset placeholder data for this rendering cycle
    clozePlaceholdersData = {};
    clozeCounter = 0;

    config.fieldIds.forEach((fieldId) => {
      renderField(fieldId);
    });
    console.log("Field rendering pass complete.");

    // --- 5. Render Mermaid Diagrams ---
    // Ensure mermaid is available and initialized
    if (typeof mermaid !== "undefined" && loadedLibraries.has("mermaid")) {
      const mermaidElements = document.querySelectorAll("pre.mermaid");
      if (mermaidElements.length > 0) {
        console.log(
          `Found ${mermaidElements.length} Mermaid elements. Rendering...`
        );
        mermaidElements.forEach((el) => (el.style.display = "block")); // Ensure visible

        try {
          // Use mermaid.run() - preferred for dynamic content
          mermaid
            .run({ nodes: mermaidElements })
            .then(() => {
              console.log("Mermaid rendering complete.");
              // Optional: Hide original <pre> if needed
              // mermaidElements.forEach(el => el.style.display = 'none');
            })
            .catch((mermaidError) => {
              logError("Mermaid rendering failed", mermaidError);
            });
        } catch (mermaidError) {
          logError("Error calling mermaid.run()", mermaidError);
        }
      }
    } else {
      // console.log("Mermaid not available or not loaded. Skipping Mermaid rendering."); // Less noisy
    }
  }

  /**
   * Makes all configured fields visible.
   * @returns {void}
   */
  function showFields() {
    config.fieldIds.forEach((fieldId) => {
      try {
        const element = document.getElementById(fieldId);
        if (element) element.style.visibility = "visible";
      } catch (e) {
        // Ignore errors if element doesn't exist
      }
    });
    // console.log("Fields made visible."); // Less noisy
  }

  // --- Initialization Flow ---

  /**
   * Main function to initialize the renderer and load resources.
   * @returns {void}
   */
  function main() {
    if (isInitialized) {
      console.log("Renderer already initialized. Re-rendering fields.");
      document
        .querySelectorAll(".katex-rendered")
        .forEach((el) => el.classList.remove("katex-rendered"));
      document
        .querySelectorAll(".hljs-highlighted")
        .forEach((el) => el.classList.remove("hljs-highlighted"));
      if (md) {
        // Check if markdown-it is ready
        renderAllFields();
      } else {
        logError("Cannot re-render: markdown-it instance not ready.");
      }
      showFields();
      return;
    }
    isInitialized = true;
    console.log("Initializing Anki Markdown/KaTeX/Cloze renderer...");
    loadedLibraries.clear(); // Clear loaded libs set on new initialization

    const coreLibs = config.resources.filter(
      (r) =>
        !r.dependsOn &&
        !r.isPlugin &&
        r.name !== "mermaid" &&
        r.name !== "mhchem" &&
        r.type === "script"
    );
    const coreCss = config.resources.filter((r) => r.type === "css");
    const katexExtensions = config.resources.filter(
      (r) => r.dependsOn === "katex" || r.name === "mhchem"
    ); // mhchem depends on katex
    const mdPlugins = config.resources.filter(
      (r) => r.isPlugin && r.dependsOn === "markdownit"
    );
    const mermaidLib = config.resources.filter((r) => r.name === "mermaid");

    // 1. Load CSS (can load in parallel with core JS)
    Promise.all(coreCss.map(loadResource)).catch((error) =>
      logError("Error loading CSS", error)
    ); // Log CSS errors but don't stop JS

    // 2. Load Core JS Libs (KaTeX, MarkdownIt, HighlightJS, KaTeX AutoRender)
    Promise.all(coreLibs.map(loadResource))
      .then(() => {
        // 3. Load KaTeX Extensions (mhchem) - Requires KaTeX
        console.log(
          "Core libs loaded (or failed non-critically). Loading KaTeX extensions..."
        );
        return Promise.all(katexExtensions.map(loadResource));
      })
      .then(() => {
        // 4. Load Markdown Plugins - Requires MarkdownIt
        console.log("KaTeX extensions loaded. Loading Markdown-it plugins...");
        return Promise.all(mdPlugins.map(loadResource));
      })
      .then(() => {
        // 5. Load Mermaid Library - No explicit JS dependency here, but load last
        console.log("Markdown-it plugins loaded. Loading Mermaid library...");
        return Promise.all(mermaidLib.map(loadResource));
      })
      .then(() => {
        // 6. Initialize Libraries (MarkdownIt, Mermaid) - Critical step
        console.log(
          "All resource loading attempted. Initializing libraries..."
        );
        return initializeLibs(); // This now returns a Promise that rejects on critical failure
      })
      .then(() => {
        // 7. Render Fields and Show - Only if initialization succeeded
        console.log("Initialization complete. Rendering content...");
        renderAllFields();
      })
      .catch((error) => {
        // Catch errors from loadResource rejections (missing dependencies) or initializeLibs rejection
        logError(
          "Critical initialization or dependency failure. Rendering halted.",
          error
        );
        // Still show fields even if rendering fails
      })
      .finally(() => {
        // 8. Always ensure fields become visible
        showFields();
        console.log("Rendering process finished.");
      });
  }

  // --- Start Execution ---
  // Use DOMContentLoaded to ensure the basic HTML structure is ready,
  // although Anki's webview might behave differently.
  // A simple direct call might be sufficient in Anki's context.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main(); // Already loaded
  }
})();
