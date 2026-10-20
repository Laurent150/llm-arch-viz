import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  latex?: string
  fallback?: string
}

/** Render KaTeX; fall back to plain Unicode text if latex missing or throws. */
export function Formula({ latex, fallback }: Props) {
  const html = useMemo(() => {
    if (!latex) return null
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
        strict: 'ignore',
      })
    } catch {
      return null
    }
  }, [latex])

  if (html) {
    return (
      <div
        className="formula katex-block"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  if (fallback) {
    return <pre className="formula formula-fallback">{fallback}</pre>
  }

  return null
}
