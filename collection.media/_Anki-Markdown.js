/**
 * @version 1.1.1
 * @author PilgrimLyieu
 * @email pilgrimlyieu@outlook.com
 * @github https://github.com/pilgrimlyieu/Anki/blob/main/collection.media/_Anki-Markdown.js
 * @license MIT
 *
 * @fileoverview Anki Markdown + KaTeX Renderer.
 * Loads necessary resources (local first, CDN fallback) and renders specified fields.
 * Handles NESTED Cloze within KaTeX using DOM-based placeholders.
 * Place this file and all local resources (files starting with '_') in Anki's `collection.media` folder.
 */
(() => {
  if (window.ankiMarkdownRendererInstance) {
    window.ankiMarkdownRendererInstance.run();
    return;
  }

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

  class ClozeHandler {
    constructor() {
      /** @type {object} Stores cloze data with unique indices { index: { tagName, attributes } } */
      this.data = {};
      /** @type {number} Counter for unique indices */
      this.counter = 0;
      /** @type {string} Prefix for start marker */
      this.startMarkerPrefix = "⛶";
      /** @type {string} Prefix for end marker */
      this.endMarkerPrefix = "⛿";
      /** @type {string} Suffix for markers */
      this.markerSuffix = "🄀";
    }

    /**
     * Reset state for re-rendering.
     */
    reset() {
      this.data = {};
      this.counter = 0;
    }

    /**
     * preprocess HTML content, replacing cloze spans with placeholders.
     * @param {string} htmlContent - original HTML.
     * @returns {string} HTML with placeholders.
     */
    preprocess(htmlContent) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      this.#processNodeRecursive(tempDiv);
      return tempDiv.innerHTML;
    }

    /**
     * Recursively processes a DOM node to replace cloze spans with placeholders.
     * @param {Node} node - current DOM node.
     */
    #processNodeRecursive(node) {
      // Start with child nodes and process from the innermost to the outermost
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          this.#processNodeRecursive(child);
        }
      });

      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.matches("span.cloze, span.cloze-inactive")
      ) {
        this.counter++;
        const index = this.counter;

        const attributes = {};
        for (const attr of node.attributes) {
          attributes[attr.name] = attr.value;
        }
        this.data[index] = {
          tagName: node.tagName.toLowerCase(),
          attributes: attributes,
        };

        const startMarker = document.createTextNode(
          `${this.startMarkerPrefix}${index}${this.markerSuffix}`
        );
        const endMarker = document.createTextNode(
          `${this.endMarkerPrefix}${index}${this.markerSuffix}`
        );

        // Replace the cloze span with start marker, its children, and end marker
        const fragment = document.createDocumentFragment();
        while (node.firstChild) {
          fragment.appendChild(node.firstChild);
        }
        node.parentNode.insertBefore(startMarker, node);
        node.parentNode.insertBefore(fragment, node);
        node.parentNode.insertBefore(endMarker, node);
        node.parentNode.removeChild(node);
      }
    }

    /**
     * Extracts the pure numeric digits from a string potentially containing HTML tags.
     * @param {string} str - The string containing digits and potentially tags.
     * @returns {string|null} The extracted digits as a string, or null if no digits found.
     */
    #extractDigits(str) {
      if (!str) return null;
      const match = str.match(/\d+/);
      return match ? match[0] : null;
    }

    /**
     * Restores cloze placeholders in the rendered HTML.
     * @param {string} htmlContent - rendered HTML.
     * @param {object} mdInstance - markdown-it instance for HTML escaping.
     * @returns {string} final HTML with cloze restored.
     */
    restore(htmlContent, mdInstance) {
      // --- Pre-processing step to remove KaTeX spans around markers ---
      // KaTeX will wrap the markers in spans with classes like "mord", "mtight", etc. like <span class="mord mtight">⛶1🄀</span>
      const katexStartMarkerWrapperRegex = new RegExp(
        `<span\\s+class="mord(?: m[a-z]+)*"[^>]*>((?:${this.startMarkerPrefix}(?:(?:<span[^>]*>)?\\d+(?:<\\/span>)?|\\d+)${this.markerSuffix})+)</span>`,
        "g"
      );
      const katexEndMarkerWrapperRegex = new RegExp(
        `<span\\s+class="mord(?: m[a-z]+)*"[^>]*>((?:${this.endMarkerPrefix}(?:(?:<span[^>]*>)?\\d+(?:<\\/span>)?|\\d+)${this.markerSuffix})+)</span>`,
        "g"
      );

      const innermostPlaceholderRegex = new RegExp(
        `${this.startMarkerPrefix}((?:<span[^>]*>)?\\d+(?:<\\/span>)?|\\d+)${this.markerSuffix}((?:(?!${this.startMarkerPrefix}|${this.endMarkerPrefix}).)*?)${this.endMarkerPrefix}((?:<span[^>]*>)?\\d+(?:<\\/span>)?|\\d+)${this.markerSuffix}`,
        "s"
      );

      // Remove the KaTeX wrappers, leaving only the marker content
      let currentHtml = htmlContent
        .replace(katexStartMarkerWrapperRegex, "$1")
        .replace(katexEndMarkerWrapperRegex, "$1");

      let iterations = 0;
      const maxIterations = 100; // Safety limit to prevent infinite loops

      while (iterations < maxIterations) {
        const matchResult = currentHtml.match(innermostPlaceholderRegex);
        if (!matchResult) break;

        const [fullMatch, startIndexPart, processedContent, endIndexPart] =
          matchResult;
        const numericStartIndex = this.#extractDigits(startIndexPart);
        const numericEndIndex = this.#extractDigits(endIndexPart);

        if (
          numericStartIndex !== null &&
          numericStartIndex === numericEndIndex
        ) {
          const index = parseInt(numericStartIndex, 10);
          const clozeData = this.data[index];

          if (clozeData) {
            let attributesString = "";
            for (const name in clozeData.attributes) {
              let escapedValue = clozeData.attributes[name];
              if (mdInstance?.utils?.escapeHtml) {
                escapedValue = mdInstance.utils.escapeHtml(escapedValue);
              }
              attributesString += ` ${name}="${escapedValue}"`;
            }
            const restoredTag = `<${clozeData.tagName}${attributesString}>${processedContent}</${clozeData.tagName}>`;
            currentHtml = currentHtml.replace(fullMatch, restoredTag);
          } else {
            // No cloze data found for this index
            logError(
              `Cloze Placeholder: No data found for innermost index ${index}. Leaving placeholder: ${fullMatch}`
            );
            break;
          }
        } else {
          // No match found in this iteration that satisfies the innermost condition
          logError(
            `Mismatched cloze indices found: start="${startIndexPart}", end="${endIndexPart}". Halting restoration.`
          );
          break;
        }
        iterations++;
      }

      if (iterations >= maxIterations) {
        logError(
          `Cloze restoration exceeded max iterations (${maxIterations}).`
        );
      }

      // Final check for any remaining placeholders (more robust check needed)
      const remainingPlaceholderRegex =
        /⛶(?:<span[^>]*>)?\d+(?:<\/span>)?|\d+🄀/;
      if (remainingPlaceholderRegex.test(currentHtml)) {
        logError(
          "Unresolved Cloze placeholders may remain after restoration loop.",
          { html: currentHtml }
        );
      }
      return currentHtml;
    }
  }

  class AnkiMarkdownRenderer {
    constructor(config) {
      /** @type {object} Configuration object */
      this.config = config;
      /** @type {boolean} Flag to prevent multiple initializations */
      this.isInitialized = false;
      /** @type {object | null} The initialized markdown-it instance */
      this.md = null;
      /** @type {Set<string>} Set of successfully loaded libraries */
      this.loadedLibraries = new Set();
      /** @type {object} Map of loaded markdown-it plugins */
      this.loadedPlugins = {};
      /** @type {ClozeHandler} Instance to handle Cloze deletions */
      this.clozeHandler = new ClozeHandler();
    }

    /**
     * Decode HTML entities.
     * @param {string} text - Text with HTML entities.
     * @return {string} Decoded text.
     */
    #decodeHTMLEntities(text) {
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    }

    /**
     * Load a single resource (CSS or JS).
     * @param {object} resource - Resource config.
     * @return {Promise} Resolves when loaded or failed.
     */
    #loadResource(resource) {
      return new Promise((resolve, reject) => {
        // Check if the dependency name is in the set of successfully loaded libs
        if (
          resource.dependsOn &&
          !this.loadedLibraries.has(resource.dependsOn)
        ) {
          const errorMsg = `${resource.name} depends on ${resource.dependsOn}, which failed to load.`;
          return reject(new Error(errorMsg)); // Reject promise for this resource
        }

        const load = (url, isLocal) => {
          let element;
          if (resource.type === "css") {
            element = document.createElement("link");
            element.rel = "stylesheet";
            element.href = url;
          } else {
            element = document.createElement("script");
            element.src = url;
          }
          element.onload = () => {
            this.loadedLibraries.add(resource.name);
            if (
              resource.isPlugin &&
              resource.pluginName &&
              window[resource.pluginName]
            ) {
              this.loadedPlugins[resource.pluginName] =
                window[resource.pluginName];
            }
            resolve();
          };
          element.onerror = () => {
            if (element.parentNode) element.parentNode.removeChild(element);
            if (isLocal && resource.cdn && resource.cdn !== "SKIP") {
              load(resource.cdn, false); // Try CDN if local fails
            } else {
              logError(`Failed to load ${resource.name} from all sources.`);
              // Resolve anyway to not break the entire chain for non-critical resources
              // The dependency check should prevent dependent libs from loading.
              resolve();
            }
          };
          document.head.appendChild(element);
        };
        load(resource.local, true); // Try local first
      });
    }

    /**
     * Load all resources based on config.
     * @return {Promise} Resolves when all resources are loaded.
     */
    async #loadAllResources() {
      const resourcesToLoad = this.config.resources.filter((r) => {
        return !r.requiredBy || this.config.plugins[r.requiredBy];
      });

      const coreLibs = resourcesToLoad.filter(
        (r) => !r.dependsOn && !r.isPlugin && r.type === "script"
      );
      const coreCss = resourcesToLoad.filter((r) => r.type === "css");
      const extensions = resourcesToLoad.filter(
        (r) => r.dependsOn && !r.isPlugin
      );
      const mdPlugins = resourcesToLoad.filter((r) => r.isPlugin);

      // Load core CSS and JS in parallel
      await Promise.all([
        ...coreCss.map((r) => this.#loadResource(r)),
        ...coreLibs.map((r) => this.#loadResource(r)),
      ]);

      // Load extensions and plugins sequentially to respect dependencies
      await Promise.all(extensions.map((r) => this.#loadResource(r)));
      await Promise.all(mdPlugins.map((r) => this.#loadResource(r)));
    }

    /**
     * Initialize Markdown-it and Mermaid with options.
     */
    #initializeLibs() {
      // Initialize Markdown-it
      if (typeof markdownit === "undefined")
        throw new Error("markdown-it library failed to load.");

      this.md = window.markdownit(this.config.markdownOptions);

      // Register KaTeX plugin first if KaTeX and plugin are loaded
      if (typeof katex !== "undefined" && typeof markdownitKatex !== "undefined") {
        this.md.use(markdownitKatex, this.config.katexOptions);
        console.log("Registered custom markdown-it-katex plugin");
      }

      // Register other plugins
      this.config.resources.forEach((res) => {
        if (
          res.isPlugin &&
          res.pluginName &&
          this.loadedPlugins[res.pluginName]
        ) {
          try {
            this.md.use(this.loadedPlugins[res.pluginName]);
            console.log(`Registered markdown-it plugin: ${res.pluginName}`);
          } catch (e) {
            logError(`Failed to use markdown-it plugin ${res.pluginName}`, e);
          }
        }
      });

      // Initialize Mermaid
      if (typeof mermaid !== "undefined") {
        try {
          mermaid.initialize(this.config.mermaidOptions);
          console.log("Mermaid initialized.");
        } catch (e) {
          logError("Failed to initialize Mermaid", e);
        }
      }
    }

    /**
     * Render a single field by ID.
     * @param {string} fieldId - ID of the field element.
     */
    #renderField(fieldId) {
      const element = document.getElementById(fieldId);
      if (!element) return;

      let content = element.innerHTML;
      let processedPlaceholders = false;

      // --- 1. Preprocess Cloze (DOM method, only for specified fields) ---
      if (this.config.clozeFieldIds?.includes(fieldId)) {
        content = this.clozeHandler.preprocess(content);
        processedPlaceholders = true;
      }

      // --- 2. Render Markdown ---
      content = this.md.render(this.#decodeHTMLEntities(content));
      element.innerHTML = content;

      // --- 3. Restore Cloze Placeholders (string method, only if preprocessed) ---
      if (processedPlaceholders) {
        const finalHtml = this.clozeHandler.restore(element.innerHTML, this.md);
        element.innerHTML = finalHtml;
      }
    }

    /**
     * Render all specified fields.
     */
    #renderAll() {
      this.clozeHandler.reset();
      this.config.fieldIds.forEach(this.#renderField.bind(this));

      // --- 5. Render Mermaid Diagrams ---
      if (typeof mermaid !== "undefined") {
        const mermaidElements = document.querySelectorAll("pre.mermaid");
        if (mermaidElements.length > 0) {
          mermaid
            .run({ nodes: mermaidElements })
            .catch((e) => logError("Mermaid rendering failed", e));
        }
      }
    }

    /**
     * Make all specified fields visible.
     */
    #showFields() {
      this.config.fieldIds.forEach((fieldId) => {
        const element = document.getElementById(fieldId);
        if (element) element.style.visibility = "visible";
      });
    }

    /**
     * Run the rendering process.
     */
    async run() {
      if (this.isInitialized) {
        console.log("Re-rendering fields.");
        this.#renderAll();
        this.#showFields();
        return;
      }

      try {
        await this.#loadAllResources();
        this.#initializeLibs();
        this.#renderAll();
      } catch (error) {
        logError("A critical error occurred during initialization.", error);
      } finally {
        this.isInitialized = true;
        this.#showFields();
        console.log("Rendering process finished.");
      }
    }
  }

  // --- Configuration ---

  const config = {
    /** @type {string[]} Field IDs to render */
    fieldIds: ["front", "back", "extra", "extra1", "extra2"],

    /** @type {string[]} Field IDs that might contain Cloze deletions and need placeholder processing. */
    clozeFieldIds: ["front", "back"],

    /** @type {object} Enabled plugins */
    plugins: {
      mark: true, // `markdown-it-mark` for ==highlight==
      footnote: true, // `markdown-it-footnote` for [^1]
      mhchem: true, // KaTeX mhchem extension for chemistry
      mermaid: true, // Mermaid diagrams
    },

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
        name: "markdownit",
        local: "_markdown-it.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js",
      },
      {
        type: "script",
        name: "markdownitKatex",
        pluginName: "markdownitKatex",
        local: "_markdown-it-katex.js",
        cdn: "SKIP",
        isPlugin: false, // This is a core plugin with customizations
        dependsOn: "katex",
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
        requiredBy: "mhchem",
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
        requiredBy: "mark",
      },
      {
        type: "script",
        name: "markdownitFootnote",
        pluginName: "markdownitFootnote",
        local: "_markdown-it-footnote.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js",
        isPlugin: true,
        dependsOn: "markdownit",
        requiredBy: "footnote",
      },

      // Mermaid
      {
        type: "script",
        name: "mermaid",
        local: "_mermaid.min.js",
        cdn: "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js",
        requiredBy: "mermaid",
      },
    ],

    /** KaTeX options */
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
        //9 格式化
        "\\nt": "\\rlap{$#1$}\\phantom{T_m}", // 宽阔
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
      highlight: (str, lang) => {
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
        return `<pre class="hljs"><code>${escaped}</code></pre>`;
      },
    },

    /** Mermaid options */
    mermaidOptions: {
      theme: "default",
      startOnLoad: false,
    },
  };

  const renderer = new AnkiMarkdownRenderer(config);
  window.ankiMarkdownRendererInstance = renderer;

  // --- Start Execution ---
  if (globalThis.onUpdateHook) {
    onUpdateHook.unshift(() => renderer.run());
  } else {
    renderer.run();
  }
})();
