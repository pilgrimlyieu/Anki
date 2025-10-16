/**
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 *
 * @fileoverview Custom markdown-it plugin for KaTeX rendering.
 * Supports escaped delimiters and whitespace rules for inline math.
 */
((root, factory) => {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.markdownitKatex = factory();
  }
})(typeof self !== "undefined" ? self : this, () => {
  /**
   * Custom markdown-it plugin for KaTeX rendering
   * @param {object} md - markdown-it instance
   * @param {object} options - KaTeX options
   */
  const markdownItKatexPlugin = (md, options) => {
    const katexOptions = options || {};

    // Utility to check if a position is preceded by an odd number of backslashes
    const hasOddNumberOfBackslashes = (src, pos) => {
      if (pos <= 0) return false;
      let backslashCount = 0;
      let checkPos = pos - 1;
      while (checkPos >= 0 && src[checkPos] === "\\") {
        backslashCount++;
        checkPos--;
      }
      return backslashCount % 2 === 1;
    };

    // Parse inline math
    const parseInlineMath = (state, silent) => {
      const delimiters = katexOptions.delimiters || [];
      const inlineDelims = delimiters.filter((d) => !d.display);

      for (const delim of inlineDelims) {
        const leftDelim = delim.left;
        const rightDelim = delim.right;

        if (!state.src.startsWith(leftDelim, state.pos)) continue;

        // Check if this is an escaped dollar sign
        if (
          leftDelim === "$" &&
          state.pos > 0 &&
          state.src[state.pos - 1] === "\\"
        )
          continue;

        // Check if this might be a block delimiter (e.g., $$)
        if (leftDelim === "$" && state.src[state.pos + 1] === "$") continue;

        const start = state.pos + leftDelim.length;

        // Rule: For $, the character after $ must not be a space
        if (leftDelim === "$" && state.src[start] === " ") continue;

        // Find closing delimiter
        let end = -1;
        let searchPos = start;

        while (searchPos < state.src.length) {
          const foundPos = state.src.indexOf(rightDelim, searchPos);
          if (foundPos === -1) break;

          // Check if it's escaped
          if (hasOddNumberOfBackslashes(state.src, foundPos)) {
            searchPos = foundPos + 1;
            continue;
          }

          // For single $, make sure we don't match $$ as closing
          if (leftDelim === "$" && state.src[foundPos + 1] === "$") {
            searchPos = foundPos + 2;
            continue;
          }

          // Rule: For $, the character before $ must not be a space
          if (
            leftDelim === "$" &&
            foundPos > start &&
            state.src[foundPos - 1] === " "
          ) {
            searchPos = foundPos + 1;
            continue;
          }

          end = foundPos;
          break;
        }

        if (end === -1) continue;

        const content = state.src.slice(start, end);

        // Don't match if content is empty
        if (!content.trim()) continue;

        // Don't match if content contains newlines (should be block)
        if (content.includes("\n")) continue;

        if (!silent) {
          const token = state.push("math_inline", "math", 0);
          token.content = content;
          token.markup = leftDelim;
        }

        state.pos = end + rightDelim.length;
        return true;
      }

      return false;
    };

    // Parse block math
    const parseBlockMath = (state, startLine, endLine, silent) => {
      const delimiters = katexOptions.delimiters || [];
      const blockDelims = delimiters.filter((d) => d.display);

      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];

      // Should have at least opening delimiter
      if (pos + 2 > max) return false;

      for (const delim of blockDelims) {
        const leftDelim = delim.left;
        const rightDelim = delim.right;

        // Check if line starts with opening delimiter
        const lineStart = state.src.slice(pos, pos + leftDelim.length);
        if (lineStart !== leftDelim) continue;

        // Check if it's escaped
        if (pos > 0 && state.src[pos - 1] === "\\") continue;

        const openPos = pos;
        const contentStart = openPos + leftDelim.length;

        // Try to find closing delimiter
        let closePos = -1;
        let closeLine = startLine;

        // Check if opening and closing are on the same line
        let searchPos = contentStart;
        let sameLine = -1;

        while (searchPos < state.eMarks[startLine]) {
          const foundPos = state.src.indexOf(rightDelim, searchPos);
          if (foundPos === -1 || foundPos >= state.eMarks[startLine]) break;

          // Check if it's escaped
          if (hasOddNumberOfBackslashes(state.src, foundPos)) {
            searchPos = foundPos + 1;
            continue;
          }

          sameLine = foundPos;
          break;
        }

        if (sameLine !== -1) {
          closePos = sameLine;
        } else {
          // Search in following lines
          for (let line = startLine + 1; line < endLine; line++) {
            const lineStart = state.bMarks[line] + state.tShift[line];
            const lineEnd = state.eMarks[line];
            const lineText = state.src.slice(lineStart, lineEnd);

            searchPos = 0;
            while (searchPos < lineText.length) {
              const idx = lineText.indexOf(rightDelim, searchPos);
              if (idx === -1) break;

              const foundPos = lineStart + idx;

              // Check if it's escaped
              if (hasOddNumberOfBackslashes(state.src, foundPos)) {
                searchPos = foundPos + 1;
                continue;
              }

              closePos = foundPos;
              closeLine = line;
              break;
            }

            if (closePos !== -1) break;
          }
        }

        if (closePos === -1) continue;

        const content = state.src.slice(contentStart, closePos).trim();

        if (!silent) {
          const token = state.push("math_block", "math", 0);
          token.content = content;
          token.markup = leftDelim;
          token.block = true;
          token.map = [startLine, closeLine + 1];
        }

        state.line = closeLine + 1;
        return true;
      }

      return false;
    };

    // Render inline math
    const renderInlineMath = (tokens, idx) => {
      const content = tokens[idx].content;
      try {
        return katex.renderToString(content, {
          ...katexOptions,
          displayMode: false,
          throwOnError: false,
        });
      } catch (e) {
        console.error("KaTeX inline render error:", e);
        return `<span class="katex-error">${md.utils.escapeHtml(
          content
        )}</span>`;
      }
    };

    // Render block math
    const renderBlockMath = (tokens, idx) => {
      const content = tokens[idx].content;
      try {
        const rendered = katex.renderToString(content, {
          ...katexOptions,
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="katex-block">${rendered}</div>\n`;
      } catch (e) {
        console.error("KaTeX block render error:", e);
        return `<div class="katex-error">${md.utils.escapeHtml(
          content
        )}</div>\n`;
      }
    };

    // Register rules
    md.inline.ruler.before("escape", "math_inline", parseInlineMath);
    md.block.ruler.before("fence", "math_block", parseBlockMath, {
      alt: ["paragraph", "reference", "blockquote", "list"],
    });

    // Register renderers
    md.renderer.rules.math_inline = renderInlineMath;
    md.renderer.rules.math_block = renderBlockMath;
  };

  return markdownItKatexPlugin;
});
