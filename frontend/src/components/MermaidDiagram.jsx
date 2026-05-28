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

    return (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <div className="message-content text-sm text-gray-100 leading-relaxed">
                <div ref={ref} className="w-full overflow-auto p-4"/>
            </div>
        </div>
    )
}