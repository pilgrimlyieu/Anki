/**
 * @version 2.0.0
 * @author PilgrimLyieu
 * @email pilgrimlyieu@outlook.com
 * @github https://github.com/pilgrimlyieu/Anki/blob/main/collection.media/_Anki-Markdown.js
 * @changelog https://github.com/pilgrimlyieu/Anki/issues/1#issuecomment-3409140670
 * @license MIT
 *
 * @fileoverview Anki Markdown + KaTeX Renderer.
 * Loads necessary resources (local first, CDN fallback) and renders specified fields.
 * Handles Cloze restoration across Markdown, KaTeX, and highlighted code using DOM markers.
 * Place this file and all local resources (files starting with '_') in Anki's `collection.media` folder.
 */

/** biome-ignore-all lint/suspicious/noAssignInExpressions: For conciseness. */
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
      error ?? "No details provided.",
    );
  }

  class ClozeHandler {
    constructor() {
      /** @type {object} Preserved cloze metadata by generated marker index. */
      this.data = {};
      /** @type {number} Counter for generated marker indices. */
      this.counter = 0;
      /** @type {string} Prefix for start marker tokens. */
      this.startMarkerPrefix = "⛶";
      /** @type {string} Prefix for end marker tokens. */
      this.endMarkerPrefix = "⛿";
      /** @type {string} Suffix shared by all marker tokens. */
      this.markerSuffix = "🄌";
      /** @type {string[]} Symbol digits used to encode marker indices without ASCII numerals. */
      this.encodedDigitChars = [
        "Ⓐ",
        "Ⓑ",
        "Ⓒ",
        "Ⓓ",
        "Ⓔ",
        "Ⓕ",
        "Ⓖ",
        "Ⓗ",
        "Ⓘ",
        "Ⓙ",
        "Ⓚ",
        "Ⓛ",
        "Ⓜ",
        "Ⓝ",
        "Ⓞ",
        "Ⓟ",
        "Ⓠ",
        "Ⓡ",
        "Ⓢ",
        "Ⓣ",
        "Ⓤ",
        "Ⓥ",
        "Ⓦ",
        "Ⓧ",
        "Ⓨ",
        "Ⓩ",
      ];
      /** @type {Map<string, number>} Lookup table for decoding encoded marker digits. */
      this.encodedDigitIndex = new Map(
        this.encodedDigitChars.map((char, index) => [char, index]),
      );
      /** @type {string} Prefix used for temporary boundary comments during restoration. */
      this.markerCommentPrefix = "anki-cloze-marker:";
      /** @type {RegExp} Cached regex for parsing temporary boundary comments. */
      this.markerCommentRegex = /^anki-cloze-marker:(start|end):(\d+)$/;
      /** @type {string} Attribute used for explicit marker elements created inside KaTeX / highlighted code. */
      this.markerAttributeName = "data-anki-cloze-marker";
      /** @type {RegExp} Cached regex for locating plain-text marker tokens. */
      this.markerRegex = this.#createMarkerRegex();
      /** @type {string} Subtrees where markers should be stripped but never restored into spans. */
      this.ignoredRestoreSelector =
        ".katex-mathml, math, annotation, script, style, textarea";
      /** @type {Set<string>} Block-level elements that cannot be wrapped directly by an inline cloze span. */
      this.blockElementTags = new Set([
        "address",
        "article",
        "aside",
        "blockquote",
        "details",
        "dialog",
        "div",
        "dl",
        "fieldset",
        "figcaption",
        "figure",
        "footer",
        "form",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hr",
        "li",
        "main",
        "nav",
        "ol",
        "p",
        "pre",
        "section",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
        "ul",
      ]);
    }

    /**
     * Reset state for re-rendering.
     */
    reset() {
      this.data = {};
      this.counter = 0;
    }

    /**
     * Preprocesses HTML by replacing cloze spans with marker tokens.
     * @param {string} htmlContent - Original HTML.
     * @returns {string} HTML with marker tokens.
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
          this.#buildMarker(index, true),
        );
        const endMarker = document.createTextNode(this.#buildMarker(index));

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
     * Encodes a numeric index using symbol digits instead of ASCII numerals.
     * @param {number} index - The numeric index to encode.
     * @returns {string} The encoded index as a string of symbol digits.
     */
    #encodeIndex(index) {
      const base = this.encodedDigitChars.length;
      if (index === 0) return this.encodedDigitChars[0];

      let remaining = index;
      let encoded = "";
      while (remaining > 0) {
        encoded = this.encodedDigitChars[remaining % base] + encoded;
        remaining = Math.floor(remaining / base);
      }

      return encoded;
    }

    /**
     * Decodes a marker index from symbol digits.
     * @param {string} encoded - The encoded marker index.
     * @returns {string | null} The decoded index or null if invalid.
     */
    #decodeIndex(encoded) {
      if (!encoded) return null;

      const base = this.encodedDigitChars.length;
      let numericValue = 0;
      for (const char of encoded) {
        const code = this.encodedDigitIndex.get(char);
        if (typeof code !== "number") return null;
        numericValue = numericValue * base + code;
      }

      return String(numericValue);
    }

    /**
     * Builds a marker string for the given index.
     * @param {number} index - The cloze index to encode in the marker.
     * @param {boolean} [isStart=false] - Whether this is a start marker (true) or end marker (false).
     * @returns {string} The constructed marker string with appropriate prefix, encoded index, and suffix.
     */
    #buildMarker(index, isStart = false) {
      const prefix = isStart ? this.startMarkerPrefix : this.endMarkerPrefix;
      return `${prefix}${this.#encodeIndex(index)}${this.markerSuffix}`;
    }

    /**
     * Replaces marker tokens in a string using the provided mapper.
     * @param {string} text - The input text containing marker tokens.
     * @param {function(Token): string} mapper - A function that takes a token and returns its replacement.
     * @returns {string} The text with marker tokens replaced by the mapper's output.
     */
    #replaceMarkerTokens(text, mapper) {
      const tokens = this.#findMarkerTokens(text);
      if (tokens.length === 0) return text;

      let result = "";
      let lastIndex = 0;
      tokens.forEach((token) => {
        result += text.slice(lastIndex, token.startPos);
        result += mapper(token);
        lastIndex = token.endPos;
      });
      result += text.slice(lastIndex);
      return result;
    }

    /**
     * Replaces plain-text markers with explicit HTML marker elements.
     * Used after code highlighting so the boundaries survive arbitrary syntax markup.
     * @param {string} text - The input text containing marker tokens.
     * @returns {string} The text with marker tokens replaced by HTML elements that have a specific attribute encoding the marker info.
     */
    replaceMarkersForHtml(text) {
      return this.#replaceMarkerTokens(
        text,
        (token) =>
          `<span ${this.markerAttributeName}="${token.kind}-${token.index}"></span>`,
      );
    }

    /**
     * Replaces plain-text markers with KaTeX-safe HTML-extension commands.
     * @param {string} text - The input text containing marker tokens.
     * @returns {string} The text with marker tokens replaced by KaTeX-safe HTML-extension commands.
     */
    replaceMarkersForKatex(text) {
      return this.#replaceMarkerTokens(
        text,
        (token) =>
          `\\htmlData{anki-cloze-marker=${token.kind}-${token.index}}{\\kern0pt}`,
      );
    }

    /**
     * Removes marker tokens from a plain string.
     * @param {string} text - The input text containing marker tokens.
     * @returns {string} The text with all marker tokens removed.
     */
    #stripMarkerTokens(text) {
      if (!text) return text;
      return this.#replaceMarkerTokens(text, () => "");
    }

    /**
     * Returns the regex used to locate plain-text marker tokens.
     * @returns {RegExp} - The regex to find marker tokens in text.
     */
    #createMarkerRegex() {
      const escapeRegExp = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const encodedDigitSet = this.encodedDigitChars.map(escapeRegExp).join("");
      return new RegExp(
        `(${escapeRegExp(this.startMarkerPrefix)}|${escapeRegExp(this.endMarkerPrefix)})([${encodedDigitSet}]+)${escapeRegExp(this.markerSuffix)}`,
        "gu",
      );
    }

    /**
     * Removes marker characters from ignored subtrees such as KaTeX MathML annotations.
     * @param {Element} root - The root element to search within for ignored subtrees.
     */
    #stripMarkersFromIgnoredSubtrees(root) {
      root.querySelectorAll(this.ignoredRestoreSelector).forEach((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let currentNode;
        while ((currentNode = walker.nextNode())) {
          const cleaned = this.#stripMarkerTokens(currentNode.nodeValue);
          if (cleaned !== currentNode.nodeValue) {
            currentNode.nodeValue = cleaned;
          }
        }
      });
    }

    /**
     * Returns whether a text node lives in an ignored subtree.
     * @param {Text} textNode - The text node to check.
     * @returns {boolean} True if the text node is within an ignored subtree, false otherwise.
     */
    #isInIgnoredSubtree(textNode) {
      return Boolean(
        textNode.parentElement?.closest(this.ignoredRestoreSelector),
      );
    }

    /**
     * @typedef {object} TextSegment - Represents a text node and its global offset range within the full text.
     * @property {Text} node - The actual text node in the DOM.
     * @property {number} start - The starting global offset of this text node in the concatenated full text.
     * @property {number} end - The ending global offset of this text node in the concatenated full text.
     */
    /**
     * @typedef {object} CollectedTextSegments - The result of collecting text nodes, including the segments and the full concatenated text.
     * @property {TextSegment[]} segments - An array of text segments representing each text node and its offset range.
     * @property {string} fullText - The full concatenated text of all collected text nodes, used for marker token searching.
     */
    /**
     * Collects text nodes and their global offsets.
     * @param {Element} root - The root element to start collecting text nodes from.
     * @returns {CollectedTextSegments} An object containing the array of text segments and the full concatenated text.
     */
    #collectTextSegments(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || this.#isInIgnoredSubtree(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const segments = [];
      let fullText = "";
      let currentNode;

      while ((currentNode = walker.nextNode())) {
        const text = currentNode.nodeValue;
        const start = fullText.length;
        fullText += text;
        segments.push({
          node: currentNode,
          start,
          end: fullText.length,
        });
      }

      return { segments, fullText };
    }

    /**
     * @typedef {object} Token - Represents a marker token found in the text.
     * @property {"start" | "end"} kind - The type of marker (start or end).
     * @property {number} index - The decoded cloze index associated with this marker.
     * @property {number} startPos - The starting global offset of the marker token in the full text.
     * @property {number} endPos - The ending global offset of the marker token in the full text.
     */
    /**
     * Finds all valid marker tokens within a flattened text stream.
     * @param {string} fullText - The concatenated text of all relevant text nodes.
     * @returns {Token[]} An array of marker tokens with their type, decoded index, and positions in the full text.
     */
    #findMarkerTokens(fullText) {
      const tokens = [];
      const markerRegex = this.markerRegex;
      markerRegex.lastIndex = 0;
      let match;

      while ((match = markerRegex.exec(fullText)) !== null) {
        const decodedIndex = this.#decodeIndex(match[2]);
        if (!decodedIndex) continue;
        tokens.push({
          kind: match[1] === this.startMarkerPrefix ? "start" : "end",
          index: parseInt(decodedIndex, 10),
          startPos: match.index,
          endPos: markerRegex.lastIndex,
        });
      }

      return tokens;
    }

    /**
     * @typedef {object} ResolvedTextPosition - Represents a resolved position within a specific text node.
     * @property {Text} node - The text node where the position is located.
     * @property {number} offset - The offset within the text node corresponding to the global position.
     */
    /**
     * Resolves a flattened text offset back to a DOM text node boundary.
     * @param {TextSegment[]} segments
     * @param {number} globalPos
     * @param {boolean} [preferNextAtBoundary=false]
     * @returns {ResolvedTextPosition | null}
     */
    #resolveTextPosition(segments, globalPos, preferNextAtBoundary = false) {
      for (let index = 0; index < segments.length; index++) {
        const segment = segments[index];
        if (globalPos < segment.end) {
          return {
            node: segment.node,
            offset: globalPos - segment.start,
          };
        }

        if (globalPos === segment.end) {
          const nextSegment = segments[index + 1];
          if (
            preferNextAtBoundary &&
            nextSegment &&
            nextSegment.start === globalPos
          ) {
            return {
              node: nextSegment.node,
              offset: 0,
            };
          }

          return {
            node: segment.node,
            offset: segment.node.nodeValue.length,
          };
        }
      }

      return null;
    }

    /**
     * Creates a temporary DOM comment used as a restoration boundary.
     * @param {"start" | "end"} kind - The type of marker (start or end) to encode in the comment.
     * @param {number} index - The cloze index to encode in the comment.
     * @returns {Comment} A DOM Comment node containing the encoded marker information as its data.
     */
    #createBoundaryComment(kind, index) {
      return document.createComment(
        `${this.markerCommentPrefix}${kind}:${index}`,
      );
    }

    /**
     * @typedef {object} ParsedBoundaryMarker - Represents the information extracted from a temporary boundary comment.
     * @property {"start" | "end"} kind - The type of marker (start or end) indicated by the comment.
     * @property {number} index - The cloze index associated with this marker, extracted from the comment data.
     */
    /**
     * Extracts marker info from a temporary boundary comment.
     * @param {string} value - The data content of the boundary comment.
     * @returns {ParsedBoundaryMarker | null}
     */
    #parseBoundaryComment(value) {
      const match = value.match(this.markerCommentRegex);
      if (!match) return null;

      return {
        kind: match[1],
        index: parseInt(match[2], 10),
      };
    }

    /**
     * Replaces explicit HTML marker elements with boundary comments.
     * @param {Element} root - The root element to search within for marker elements.
     */
    #replaceElementMarkersWithBoundaryComments(root) {
      root
        .querySelectorAll(`[${this.markerAttributeName}]`)
        .forEach((element) => {
          const value = element.getAttribute(this.markerAttributeName);
          const match = value?.match(/^(start|end)-(\d+)$/);

          if (!match) {
            element.remove();
            return;
          }

          element.replaceWith(
            this.#createBoundaryComment(match[1], parseInt(match[2], 10)),
          );
        });
    }

    /**
     * Replaces plain-text marker tokens with boundary comments in the rendered DOM.
     * @param {Element} root - The root element to search within for marker tokens.
     */
    #replaceTextMarkersWithBoundaryComments(root) {
      const { segments, fullText } = this.#collectTextSegments(root);
      if (!fullText) return;

      const tokens = this.#findMarkerTokens(fullText);
      if (tokens.length === 0) return;

      [...tokens]
        .sort((a, b) => b.startPos - a.startPos)
        .forEach((token) => {
          const startPoint = this.#resolveTextPosition(
            segments,
            token.startPos,
            true,
          );
          const endPoint = this.#resolveTextPosition(segments, token.endPos);

          if (!startPoint || !endPoint) {
            logError(
              `Failed to resolve cloze marker boundaries for index ${token.index}.`,
            );
            return;
          }

          const range = document.createRange();
          range.setStart(startPoint.node, startPoint.offset);
          range.setEnd(endPoint.node, endPoint.offset);
          range.deleteContents();
          range.insertNode(
            this.#createBoundaryComment(token.kind, token.index),
          );
        });
    }

    /**
     * @typedef {object} BoundaryPair - Represents a matched pair of start and end boundary comments for a cloze range.
     * @property {number} index - The cloze index associated with this pair of boundary comments.
     * @property {Comment} startComment - The DOM Comment node representing the start boundary of the cloze range.
     * @property {Comment} endComment - The DOM Comment node representing the end boundary of the cloze range.
     */
    /**
     * Matches temporary boundary comments into cloze ranges.
     * @param {Element} root - The root element to search within for boundary comments.
     * @returns {BoundaryPair[]}
     */
    #collectMatchedBoundaryPairs(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
      const stack = [];
      const pairs = [];
      let currentNode;

      while ((currentNode = walker.nextNode())) {
        const marker = this.#parseBoundaryComment(currentNode.data);
        if (!marker) continue;

        if (marker.kind === "start") {
          stack.push({ ...marker, comment: currentNode });
          continue;
        }

        let matchingIndex = -1;
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].index === marker.index) {
            matchingIndex = i;
            break;
          }
        }

        if (matchingIndex === -1) {
          logError(`Orphaned cloze end marker for index ${marker.index}.`);
          currentNode.remove();
          continue;
        }

        if (matchingIndex !== stack.length - 1) {
          logError(
            `Crossed cloze markers detected while restoring index ${marker.index}.`,
          );
        }

        const start = stack.splice(matchingIndex, 1)[0];
        pairs.push({
          index: marker.index,
          startComment: start.comment,
          endComment: currentNode,
        });
      }

      stack.forEach((entry) => {
        logError(`Unclosed cloze start marker for index ${entry.index}.`);
        entry.comment.remove();
      });

      return pairs;
    }

    /**
     * Returns the nearest element sibling in the requested direction.
     * @param {Node | null} node - The reference node to find siblings from.
     * @param {"next" | "previous"} direction - The direction to look for siblings ("next" for nextSibling, "previous" for previousSibling).
     * @returns {Element | null} The nearest element sibling in the specified direction, or null if none found.
     */
    #getAdjacentElementSibling(node, direction) {
      let current =
        direction === "next"
          ? (node?.nextSibling ?? null)
          : (node?.previousSibling ?? null);
      while (current && current.nodeType !== Node.ELEMENT_NODE) {
        current =
          direction === "next"
            ? (current.nextSibling ?? null)
            : (current.previousSibling ?? null);
      }
      return current;
    }

    /**
     * Moves boundary comments to block edges when a range starts or ends exactly at a block boundary.
     * This keeps wrappers inside the intended block instead of swallowing neighboring inline markup.
     * @param {Comment} startComment - The start boundary comment of the cloze range.
     * @param {Comment} endComment - The end boundary comment of the cloze range.
     */
    #alignBoundaryPairWithBlockEdges(startComment, endComment) {
      const nextBlock = this.#getAdjacentElementSibling(startComment, "next");
      if (
        this.#isBlockElement(nextBlock) &&
        (nextBlock === endComment.parentNode || nextBlock.contains(endComment))
      ) {
        nextBlock.insertBefore(startComment, nextBlock.firstChild);
      }

      const previousBlock = this.#getAdjacentElementSibling(
        endComment,
        "previous",
      );
      if (
        this.#isBlockElement(previousBlock) &&
        (previousBlock === startComment.parentNode ||
          previousBlock.contains(startComment))
      ) {
        previousBlock.appendChild(endComment);
      }
    }

    /**
     * Normalizes boundary comments before extraction so block-level structure stays valid.
     * Cross-block clozes are restored as multiple block-local wrappers rather than one invalid span.
     * @param {BoundaryPair[]} pairs - The array of matched boundary pairs to normalize.
     */
    #normalizeBoundaryPairs(pairs) {
      pairs.forEach(({ startComment, endComment }) => {
        this.#alignBoundaryPairWithBlockEdges(startComment, endComment);
      });
    }

    /**
     * Builds the final cloze element from preserved tag metadata.
     * @param {number} index - The cloze index to retrieve metadata for.
     * @returns {Element | null} The created cloze element with the correct tag and attributes, or null if metadata is missing.
     */
    #createClozeElement(index) {
      const clozeData = this.data[index];
      if (!clozeData) {
        logError(`Cloze data missing for index ${index}.`);
        return null;
      }

      const element = document.createElement(clozeData.tagName);
      Object.entries(clozeData.attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
      });
      return element;
    }

    /**
     * Checks whether a node is a block-level element that should not be wrapped by an inline span.
     * @param {Node} node - The node to check.
     * @returns {boolean} True if the node is a block-level element, false otherwise.
     */
    #isBlockElement(node) {
      return (
        node?.nodeType === Node.ELEMENT_NODE &&
        this.blockElementTags.has(node.tagName.toLowerCase())
      );
    }

    /**
     * Returns whether a node only contributes ignorable whitespace between blocks.
     * @param {Node} node - The node to check.
     * @returns {boolean} True if the node is a text node that is empty or only whitespace, false otherwise.
     */
    #isIgnorableWhitespaceNode(node) {
      return node?.nodeType === Node.TEXT_NODE && !node.nodeValue.trim();
    }

    /**
     * Returns whether a fragment contains any non-whitespace inline content.
     * @param {DocumentFragment} fragment - The fragment to check for meaningful content.
     * @returns {boolean} True if the fragment contains at least one child node that is not ignorable whitespace, false if it is empty or only whitespace nodes.
     */
    #hasMeaningfulInlineContent(fragment) {
      return Array.from(fragment.childNodes).some(
        (node) => !this.#isIgnorableWhitespaceNode(node),
      );
    }

    /**
     * Wraps a fragment in a cloze span when it contains meaningful inline content.
     * @param {number} index - The cloze index to retrieve metadata for.
     * @param {DocumentFragment} fragment - The fragment to wrap.
     * @returns {Node | null} The wrapped fragment or the original fragment if no wrapping was needed.
     */
    #wrapInlineFragment(index, fragment) {
      if (
        !fragment.hasChildNodes() ||
        !this.#hasMeaningfulInlineContent(fragment)
      ) {
        return null;
      }

      const clozeElement = this.#createClozeElement(index);
      if (!clozeElement) return fragment;
      clozeElement.appendChild(fragment);
      return clozeElement;
    }

    /**
     * Recursively wraps a block element's descendants while preserving valid HTML structure.
     * @param {number} index - The cloze index to retrieve metadata for.
     * @param {Element} blockNode - The block element to wrap.
     * @returns {Element} The wrapped block element.
     */
    #wrapBlockNode(index, blockNode) {
      const clone = blockNode.cloneNode(false);
      const innerFragment = document.createDocumentFragment();

      while (blockNode.firstChild) {
        innerFragment.appendChild(blockNode.firstChild);
      }

      clone.appendChild(this.#wrapRestoredFragment(index, innerFragment));
      return clone;
    }

    /**
     * Wraps extracted content while preserving valid HTML structure for block-level nodes.
     * @param {number} index - The cloze index to retrieve metadata for.
     * @param {DocumentFragment} fragment - The fragment to wrap.
     * @returns {Node} The wrapped fragment or the original fragment if no wrapping was needed.
     */
    #wrapRestoredFragment(index, fragment) {
      const directNodes = Array.from(fragment.childNodes);
      const hasBlockNode = directNodes.some((node) =>
        this.#isBlockElement(node),
      );

      if (!hasBlockNode) {
        return (
          this.#wrapInlineFragment(index, fragment) ??
          document.createDocumentFragment()
        );
      }

      const output = document.createDocumentFragment();
      let inlineFragment = document.createDocumentFragment();

      const flushInlineFragment = () => {
        const wrappedInline = this.#wrapInlineFragment(index, inlineFragment);
        if (wrappedInline) {
          output.appendChild(wrappedInline);
        }
        inlineFragment = document.createDocumentFragment();
      };

      while (fragment.firstChild) {
        const node = fragment.firstChild;
        fragment.removeChild(node);

        if (!this.#isBlockElement(node)) {
          inlineFragment.appendChild(node);
          continue;
        }

        flushInlineFragment();
        output.appendChild(this.#wrapBlockNode(index, node));
      }

      flushInlineFragment();
      return output;
    }

    /**
     * Restores matched cloze ranges into real span elements.
     * @param {BoundaryPair[]} pairs - The array of matched boundary pairs to restore.
     */
    #restoreBoundaryPairs(pairs) {
      const orderedPairs = [...pairs].sort((a, b) => {
        const position = a.startComment.compareDocumentPosition(b.startComment);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return 1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return -1;
        return 0;
      });

      orderedPairs.forEach(({ index, startComment, endComment }) => {
        if (!startComment.parentNode || !endComment.parentNode) return;

        const range = document.createRange();
        range.setStartAfter(startComment);
        range.setEndBefore(endComment);

        const fragment = range.extractContents();
        const restoredNode = this.#wrapRestoredFragment(index, fragment);
        range.insertNode(restoredNode);

        startComment.remove();
        endComment.remove();
      });
    }

    /**
     * Removes leftover boundary comments and stray marker characters after restoration.
     * @param {Element} root - The root element to clean up after restoration.
     */
    #cleanupMarkerArtifacts(root) {
      const commentWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_COMMENT,
      );
      const commentsToRemove = [];
      let currentComment;

      while ((currentComment = commentWalker.nextNode())) {
        if (currentComment.data.startsWith(this.markerCommentPrefix)) {
          commentsToRemove.push(currentComment);
        }
      }
      commentsToRemove.forEach((comment) => void comment.remove());

      root
        .querySelectorAll(`[${this.markerAttributeName}]`)
        .forEach((element) => void element.remove());

      const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let currentText;
      while ((currentText = textWalker.nextNode())) {
        const cleaned = this.#stripMarkerTokens(currentText.nodeValue);
        if (cleaned !== currentText.nodeValue) {
          currentText.nodeValue = cleaned;
        }
      }

      this.#removeEmptyParagraphArtifacts(root);
    }

    /**
     * Removes empty paragraphs introduced as restoration artifacts.
     * @param {Element} root - The root element to clean up.
     */
    #removeEmptyParagraphArtifacts(root) {
      root.querySelectorAll("p").forEach((paragraph) => {
        if (paragraph.attributes.length > 0) return;
        if (paragraph.textContent.trim()) return;
        if (paragraph.querySelector("*")) return;
        paragraph.remove();
      });
    }

    /**
     * Restores cloze placeholders inside a rendered field element.
     * @param {Element} root - The root element containing the rendered content with marker tokens.
     * @return {{pairCount: number} | null} An object containing the count of restored cloze pairs, or null if no root element is provided.
     */
    restore(root) {
      if (!root) return null;

      this.#stripMarkersFromIgnoredSubtrees(root);
      this.#replaceElementMarkersWithBoundaryComments(root);
      this.#replaceTextMarkersWithBoundaryComments(root);
      const pairs = this.#collectMatchedBoundaryPairs(root);
      this.#normalizeBoundaryPairs(pairs);
      this.#restoreBoundaryPairs(pairs);
      this.#cleanupMarkerArtifacts(root);
      return { pairCount: pairs.length };
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
      /** @type {ClozeHandler} Instance to preprocess and restore Cloze spans */
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
            if (isLocal && resource.cdn) {
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
        (r) => !r.dependsOn && !r.isPlugin && r.type === "script",
      );
      const coreCss = resourcesToLoad.filter((r) => r.type === "css");
      const extensions = resourcesToLoad.filter(
        (r) => r.dependsOn && !r.isPlugin,
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
     * Custom code highlighter for markdown-it.
     * @param {string} str The code string.
     * @param {string} lang The language name.
     * @returns {string} The highlighted HTML string.
     */
    #highlightCode(str, lang) {
      const escapeHtml = this.md.utils.escapeHtml;
      if (lang === "mermaid") {
        return `<pre class="mermaid">${escapeHtml(str)}</pre>`;
      } else if (lang && hljs.getLanguage(lang)) {
        try {
          const highlightedHtml =
            '<pre class="hljs"><code>' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true })
              .value +
            "</code></pre>";
          return this.clozeHandler.replaceMarkersForHtml(highlightedHtml);
        } catch {}
      }

      return this.clozeHandler.replaceMarkersForHtml(
        `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`,
      );
    }

    /**
     * Initialize Markdown-it and Mermaid with options.
     */
    #initializeLibs() {
      // Initialize Markdown-it
      if (typeof markdownit === "undefined")
        throw new Error("markdown-it library failed to load.");

      const mdOptions = {
        ...this.config.markdownOptions,
        highlight: this.#highlightCode.bind(this),
      };
      this.md = window.markdownit(mdOptions);

      // Register KaTeX plugin first if KaTeX and plugin are loaded
      if (
        typeof katex !== "undefined" &&
        typeof markdownitKatex !== "undefined"
      ) {
        this.md.use(markdownitKatex, {
          ...this.config.katexOptions,
          preprocessMathContent: this.clozeHandler.replaceMarkersForKatex.bind(
            this.clozeHandler,
          ),
        });
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

      // Check if highlight.js is loaded
      if (typeof hljs === "undefined") {
        // Log error but don't reject, highlighting might be optional
        logError(
          "Highlight.js library not loaded. Code highlighting might not work.",
        );
      } else {
        console.log("Highlight.js ready.");
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

      // --- 3. Restore Cloze placeholders in the rendered DOM ---
      if (processedPlaceholders) {
        this.clozeHandler.restore(element);
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

    /**
     * @typedef {object} MarkdownItOptions - Options to configure markdown-it behavior.
     * @property {boolean} mark - Enable `markdown-it-mark` plugin for ==highlight== syntax.
     * @property {boolean} footnote - Enable `markdown-it-footnote` plugin for [^1] footnotes.
     * @property {boolean} mhchem - Enable KaTeX mhchem extension for chemistry notation.
     * @property {boolean} mermaid - Enable Mermaid diagrams with ```mermaid fenced code blocks.
     */
    /** @type {MarkdownItOptions} Enabled plugins */
    plugins: {
      mark: true, // `markdown-it-mark` for ==highlight==
      footnote: true, // `markdown-it-footnote` for [^1]
      mhchem: true, // KaTeX mhchem extension for chemistry
      mermaid: true, // Mermaid diagrams
    },

    /**
     * @typedef {object} Resource - Represents a CSS or JS resource to load, with optional dependency information.
     * @property {"css" | "script"} type - The type of resource (CSS or JavaScript).
     * @property {string} name - A unique name for the resource.
     * @property {string} local - The local path to the resource file.
     * @property {string | false} cdn - The CDN URL for the resource, or false if no CDN fallback is available.
     * @property {boolean} [isPlugin=false] - Whether this resource is a markdown-it plugin.
     * @property {string} [pluginName] - The global variable name of the plugin (if isPlugin is true).
     * @property {string} [dependsOn] - The name of another resource that must be loaded before this one.
     * @property {string} [requiredBy] - A key indicating which feature requires this resource, used for conditional loading.
     */
    /** @type {Resource[]} List of resources to load */
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
        cdn: false,
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
    },

    /** Mermaid options */
    mermaidOptions: {
      theme: "default",
      startOnLoad: false,
    },
  };

  if (window.__ANKI_MARKDOWN_ENABLE_TEST_HOOKS__) {
    window.__AnkiMarkdownTestHooks = {
      ClozeHandler,
      config: JSON.parse(JSON.stringify(config)),
    };
  }

  const renderer = new AnkiMarkdownRenderer(config);
  window.ankiMarkdownRendererInstance = renderer;

  // --- Start Execution ---
  if (globalThis.onUpdateHook) {
    onUpdateHook.unshift(() => renderer.run());
  } else {
    renderer.run();
  }
})();
