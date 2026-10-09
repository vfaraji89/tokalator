const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeUrl(href: string, base?: string): string | null {
  try {
    const url = new URL(href, base || undefined);
    return SAFE_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

type Heading = { level: number; text: string };

const HREF = String.raw`\(\s*<?((?:[^\s()<>]|\([^\s()]*\))+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)`;
const IMAGE_RE = new RegExp(String.raw`!\[([^\]]*)\]` + HREF, "g");
const LINK_RE = new RegExp(String.raw`\[([^\]]*)\]` + HREF, "g");
const REF_LINK_RE = /(!?)\[([^\]]+)\]\[([^\]]*)\]/g;

export function renderMarkdown(md: string, baseUrl?: string): string {
  const refs = new Map<string, string>();
  const lines = md
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => {
      const m = line.match(/^ {0,3}\[([^\]]+)\]:\s*<?(\S+?)>?(?:\s+["'(].*["')])?\s*$/);
      if (m) refs.set(m[1].toLowerCase(), m[2]);
      return !m;
    });

  const slots: string[] = [];
  const plain: string[] = [];
  const hold = (html: string, text?: string) => {
    if (text !== undefined) plain[slots.length] = text;
    return `\0${slots.push(html) - 1}\0`;
  };
  const restore = (s: string): string => s.replace(/\0(\d+)\0/g, (_, n: string) => restore(slots[Number(n)]));

  const emphasis = (s: string) =>
    escapeHtml(s)
      .replace(/&lt;br\s*\/?&gt;/gi, "<br />")
      .replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(\S(?:[\s\S]*?\S)?)__/g, "<strong>$1</strong>")
      .replace(/(^|[^\w*])\*(\S(?:[^*]*?\S)?)\*(?![\w*])/g, "$1<em>$2</em>")
      .replace(/(^|[^\w])_(\S(?:[^_]*?\S)?)_(?!\w)/g, "$1<em>$2</em>");

  const anchor = (url: string, html: string) =>
    `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${html}</a>`;

  const image = (alt: string, href: string) => {
    const label = alt ? `Image: ${alt}` : "Image";
    const url = safeUrl(href, baseUrl);
    return hold(url ? anchor(url, escapeHtml(label)) : escapeHtml(label), label);
  };

  const link = (label: string, href: string) => {
    const html = emphasis(label.replace(/\0(\d+)\0/g, (m, n: string) => plain[Number(n)] ?? m));
    const url = safeUrl(href, baseUrl);
    return hold(url ? anchor(url, html) : html);
  };

  const inline = (text: string) =>
    restore(
      emphasis(
        text
          .replace(/(`+)([\s\S]*?)\1(?!`)/g, (_, __, code: string) => hold(`<code>${escapeHtml(code.trim())}</code>`))
          .replace(IMAGE_RE, (_, alt: string, href: string) => image(alt, href))
          .replace(LINK_RE, (_, label: string, href: string) => link(label, href))
          .replace(REF_LINK_RE, (m, bang: string, label: string, ref: string) => {
            const href = refs.get((ref || label).toLowerCase());
            if (!href) return m;
            return bang ? image(label, href) : link(label, href);
          }),
      ),
    );

  const out: (string | Heading)[] = [];
  let para: string[] = [];
  let quote: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join("\n"))}</p>`);
    para = [];
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join("\n"))}</p></blockquote>`);
    quote = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flush = () => {
    flushPara();
    flushQuote();
    flushList();
  };
  const cells = (row: string) =>
    row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => inline(c.trim()));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fence = line.match(/^\s*(`{3,}|~{3,})\s*([\w+-]*)/);
    if (fence) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].trim().startsWith(fence[1])) code.push(lines[i]);
      const cls = fence[2] ? ` class="lang-${fence[2]}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = line.match(/^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/);
    if (heading) {
      flush();
      out.push({ level: heading[1].length, text: heading[2] });
      continue;
    }

    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      flush();
      out.push("<hr />");
      continue;
    }

    const next = lines[i + 1] ?? "";
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?\s*:?-{2,}/.test(next)) {
      flush();
      const head = cells(line);
      const rows: string[][] = [];
      i++;
      while (i + 1 < lines.length && /^\s*\|/.test(lines[i + 1])) rows.push(cells(lines[++i]));
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }

    const item = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
    if (item) {
      const tag = /\d/.test(item[1]) ? "ol" : "ul";
      flushPara();
      flushQuote();
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push(item[2]);
      continue;
    }

    if (list && /^\s+\S/.test(line)) {
      list.items[list.items.length - 1] += `\n${line.trim()}`;
      continue;
    }

    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) {
      flushPara();
      flushList();
      quote.push(q[1]);
      continue;
    }

    flushQuote();
    flushList();
    para.push(line.trim());
  }
  flush();

  const levels = out.filter((b): b is Heading => typeof b !== "string").map((b) => b.level);
  const shift = levels.length ? 2 - Math.min(...levels) : 0;
  return out
    .map((b) => {
      if (typeof b === "string") return b;
      const level = Math.min(b.level + shift, 6);
      return `<h${level}>${inline(b.text)}</h${level}>`;
    })
    .join("\n");
}
