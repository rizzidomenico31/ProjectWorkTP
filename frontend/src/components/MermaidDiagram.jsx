import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
    startOnLoad: false,
    theme: 'default'
})

export default function MermaidDiagram({ chart }) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current && chart) {
            mermaid.render('mermaid-diagram', chart).then(({ svg }) => {
                ref.current.innerHTML = svg
            })
        }
    }, [chart])

    return <div ref={ref} className="w-full overflow-auto p-4" />
}