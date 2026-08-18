const vscode = require("vscode");

function activate(context) {
  return {
    extendMarkdownIt(md) {
      const defaultFence =
        md.renderer.rules.fence ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options);
        };

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const lang = (token.info || "").trim().toLowerCase();

        if (["night", "nightlang", "prognight", "n"].includes(lang)) {
          const highlightedCode = highlightNightCode(token.content);
          return `<pre class="vscode-light vscode-dark"><code class="language-night">${highlightedCode}</code></pre>\n`;
        }

        return defaultFence(tokens, idx, options, env, self);
      };

      return md;
    },
  };
}

function highlightNightCode(code) {
  const patterns = [
    // 1. comment blocks
    {
      type: "comment",
      regex: /^;-[\s\S]*?-;/,
      style: "color: #6A9955; font-style: italic;",
    },
    // 2. single line comments
    {
      type: "comment",
      regex: /^;[^\r\n]*/,
      style: "color: #6A9955; font-style: italic;",
    },
    // 3. strings ' ' and " "
    {
      type: "string",
      regex: /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'/,
      style: "color: #CE9178;",
    },
    // 4. keywords
    {
      type: "keyword",
      regex:
        /^\b(if|elif|else|during|repeat|count|arg|incase|attempt|send|end|kill|break|continue|main|using)\b/,
      style: "color: #C586C0; font-weight: bold;",
    },
    // 5. vars and decl
    {
      type: "variable",
      regex: /^([#%@$?])([a-zA-Z_][a-zA-Z0-9_]*)/,
      style: "color: #569CD6;",
      subStyle: "color: #9CDCFE;",
    },
    // 6. nums
    {
      type: "number",
      regex: /^\b\d+(?:\.\d+)?\b/,
      style: "color: #B5CEA8;",
    },
    // 7. pointers
    {
      type: "operator",
      regex: /^(->>>|->>|->|<<<-|<<-|<-|\.)/,
      style: "color: #D4D4D4;",
    },
  ];

  let result = "";
  let pos = 0;

  while (pos < code.length) {
    let matched = false;

    if (
      code[pos] === "\n" ||
      code[pos] === " " ||
      code[pos] === "\t" ||
      code[pos] === "\r"
    ) {
      const char = code[pos];
      result +=
        char === "&"
          ? "&amp;"
          : char === "<"
            ? "&lt;"
            : char === ">"
              ? "&gt;"
              : char;
      pos++;
      continue;
    }

    const rest = code.slice(pos);

    for (const p of patterns) {
      const m = rest.match(p.regex);
      if (m) {
        matched = true;
        const text = m[0];

        if (p.type === "variable" && m[1] && m[2]) {
          result += `<span style="${p.style}">${escapeHtml(m[1])}</span><span style="${p.subStyle}">${escapeHtml(m[2])}</span>`;
        } else {
          result += `<span style="${p.style}">${escapeHtml(text)}</span>`;
        }

        pos += text.length;
        break;
      }
    }

    if (!matched) {
      result += escapeHtml(code[pos]);
      pos++;
    }
  }

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
