import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  markdown: string
  className?: string
}

// Rewrite old markdown image paths (which pointed into src/) to the new
// static URLs served from public/assets.
const imageSrcRewrite: Record<string, string> = {
  '../assets/family.jpg': '/assets/family.jpg',
  '../assets/friends.jpg': '/assets/friends.jpg',
  '../assets/friends_uni.jpg': '/assets/friends_uni.jpg',
}

export default function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  const rendered = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        ul: ({ node, ...props }) => (
          <ul className="markdown-list markdown-list-unordered" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="markdown-list markdown-list-ordered" {...props} />
        ),
        li: ({ node, children, ...props }) => (
          <li className="markdown-list-item" {...props}>
            {children}
          </li>
        ),
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer" />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="markdown-quote" {...props} />
        ),
        img: ({ node, src, ...props }: any) => {
          const rewritten = src && imageSrcRewrite[src]
          return (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={rewritten ?? src}
              loading="lazy"
              decoding="async"
              {...props}
            />
          )
        },
        // `inline` and `className` come from react-markdown; type as any to avoid over-constraining.
        code: ({ node, inline, className: codeClassName, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className={`markdown-code-inline${codeClassName ? ` ${codeClassName}` : ''}`}
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <pre className="markdown-code-block">
              <code className={codeClassName} {...props}>
                {children}
              </code>
            </pre>
          )
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  )

  if (!className) return rendered
  return <div className={className}>{rendered}</div>
}

