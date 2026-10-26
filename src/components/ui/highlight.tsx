/**
 * Tiny, safe syntax highlighter: a regex tokenizer that returns React nodes (never HTML strings).
 * Languages: bash/sh/shell, ts/tsx/js/javascript/typescript, solidity/sol, json, markdown/md.
 * Pure function — usable from server components.
 */
import type { ReactNode } from 'react'

type Rule = readonly [cls: string, re: RegExp]

const T = {
  comment: 'text-fg-3 italic',
  keyword: 'text-accent',
  string: 'text-[#e7c58f]',
  number: 'text-[#c9b2ff]',
  fn: 'text-[#8fc8ff]',
  type: 'text-[#f5b8a0]',
  prop: 'text-[#8fc8ff]',
  flag: 'text-[#c9b2ff]',
  cmd: 'text-accent',
  variable: 'text-[#f5b8a0]',
  punct: 'text-fg-3',
  heading: 'text-fg font-medium',
  bold: 'text-fg font-semibold',
  code: 'text-[#e7c58f]',
  link: 'text-[#8fc8ff] underline decoration-fg-3/50',
} as const

const y = (src: string, flags = '') => new RegExp(src, `y${flags}`)

const JS_KEYWORDS =
  'import|from|export|default|const|let|var|function|return|async|await|if|else|for|while|of|in|new|try|catch|finally|throw|type|interface|extends|implements|as|satisfies|typeof|keyof|class|null|undefined|true|false|this|void'
const SOL_KEYWORDS =
  'pragma|solidity|contract|interface|library|function|returns|return|external|public|internal|private|view|pure|payable|nonpayable|memory|calldata|storage|event|error|emit|revert|require|modifier|mapping|struct|enum|if|else|for|while|indexed|constant|immutable|override|virtual|true|false'
const SOL_TYPES = 'address|bool|string|bytes\\d*|uint\\d*|int\\d*'

const RULES: Record<string, readonly Rule[]> = {
  bash: [
    [T.comment, y('(?<=^|\\s)#[^\\n]*', 'm')],
    [T.string, y(`'[^'\\n]*'|"(?:\\\\.|[^"\\\\\\n])*"`)],
    [T.variable, y('\\$\\{?[A-Za-z_][A-Za-z0-9_]*\\}?')],
    [T.cmd, y('(?<=^|&&\\s*|\\|\\s*|;\\s*|\\$\\s)(?:aidr|export|cd|bun|bunx|npm|npx|node|forge|cast|curl|git|echo|source|sudo|mkdir|cat)\\b', 'm')],
    [T.flag, y('(?<=\\s)--?[A-Za-z][\\w-]*')],
    [T.number, y('\\b0x[0-9a-fA-F…]+|\\b\\d+(?:\\.\\d+)?\\b')],
  ],
  ts: [
    [T.comment, y('//[^\\n]*|/\\*[\\s\\S]*?\\*/')],
    [T.string, y("'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`")],
    [T.keyword, y(`\\b(?:${JS_KEYWORDS})\\b`)],
    [T.number, y('\\b0x[0-9a-fA-F]+n?\\b|\\b\\d[\\d_]*(?:\\.\\d+)?n?\\b')],
    [T.type, y('\\b[A-Z][A-Za-z0-9_]*\\b')],
    [T.fn, y('\\b[a-zA-Z_$][\\w$]*(?=\\s*\\()')],
  ],
  solidity: [
    [T.comment, y('//[^\\n]*|/\\*[\\s\\S]*?\\*/')],
    [T.string, y(`"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'`)],
    [T.keyword, y(`\\b(?:${SOL_KEYWORDS})\\b`)],
    [T.type, y(`\\b(?:${SOL_TYPES})\\b|\\b[A-Z][A-Za-z0-9_]*\\b`)],
    [T.number, y('\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?\\b')],
    [T.fn, y('\\b[a-zA-Z_][\\w]*(?=\\s*\\()')],
  ],
  json: [
    [T.prop, y('"(?:\\\\.|[^"\\\\\\n])*"(?=\\s*:)')],
    [T.string, y('"(?:\\\\.|[^"\\\\\\n])*"')],
    [T.number, y('-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b')],
    [T.keyword, y('\\b(?:true|false|null)\\b')],
    [T.punct, y('[{}\\[\\],:]')],
  ],
  markdown: [
    [T.heading, y('^#{1,6} [^\\n]*', 'm')],
    [T.comment, y('^---$', 'm')],
    [T.punct, y('^\\s*(?:[-*]|\\d+\\.)(?= )', 'm')],
    [T.code, y('`[^`\\n]+`')],
    [T.bold, y('\\*\\*[^*\\n]+\\*\\*')],
    [T.link, y('\\[[^\\]\\n]+\\]\\([^)\\n]+\\)')],
  ],
}

const ALIASES: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  terminal: 'bash',
  ts: 'ts',
  tsx: 'ts',
  typescript: 'ts',
  js: 'ts',
  jsx: 'ts',
  javascript: 'ts',
  sol: 'solidity',
  solidity: 'solidity',
  json: 'json',
  jsonc: 'json',
  md: 'markdown',
  markdown: 'markdown',
  bash: 'bash',
}

export function normalizeLang(lang?: string): string | undefined {
  if (!lang) return undefined
  return ALIASES[lang.toLowerCase()]
}

/** Tokenize `code` into React nodes. Unknown languages return the plain string. */
export function highlight(code: string, lang?: string): ReactNode {
  const key = normalizeLang(lang)
  const rules = key ? RULES[key] : undefined
  if (!rules) return code
  const out: ReactNode[] = []
  let plain = ''
  let i = 0
  let n = 0
  while (i < code.length) {
    let matched = false
    for (const [cls, re] of rules) {
      re.lastIndex = i
      const m = re.exec(code)
      if (m && m[0].length > 0) {
        if (plain) {
          out.push(plain)
          plain = ''
        }
        out.push(
          <span key={n++} className={cls}>
            {m[0]}
          </span>,
        )
        i += m[0].length
        matched = true
        break
      }
    }
    if (!matched) {
      // consume a whole identifier at once so keywords inside words never match mid-word
      const word = /[A-Za-z0-9_$]+/y
      word.lastIndex = i
      const w = word.exec(code)
      const chunk = w ? w[0] : code[i]
      plain += chunk
      i += chunk.length
    }
  }
  if (plain) out.push(plain)
  return out
}
