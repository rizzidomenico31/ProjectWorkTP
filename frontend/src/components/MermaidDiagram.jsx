import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    // 'strict' fa sì che Mermaid faccia escaping dell'HTML nelle label e non
    // esegua script: difesa contro XSS dato che l'SVG è iniettato via innerHTML.
    securityLevel: 'strict',
})

function sanitizeMermaid(text = '') {
    return String(text)
        .replace(/"/g, "'")
        .replace(/[<>]/g, ' ')
        .trim()
}

function collectIds(nodes, map = {}) {
    nodes.forEach(node => {
        map[node.id] = sanitizeMermaid(node.label)
        if (node.children?.length) collectIds(node.children, map)
    })
    return map
}

function buildNodes(nodes, lines, parentId = null) {
    nodes.forEach(node => {
        lines.push(`    ${node.id}["${sanitizeMermaid(node.label)}"]`)
        if (parentId) lines.push(`    ${parentId} --> ${node.id}`)
        if (node.children?.length) buildNodes(node.children, lines, node.id)
    })
}

function jsonToMermaidFlowchart(content) {
    const map = typeof content === 'string' ? JSON.parse(content) : content
    const center = sanitizeMermaid(map?.center || 'Mappa')
    const nodes = map?.nodes || []
    const edges = map?.edges || []

    const lines = [
        'flowchart TD',
        `    root["${center}"]`
    ]

    // Collega root ai nodi top-level e costruisce ricorsivamente
    nodes.forEach(node => {
        buildNodes([node], lines, 'root')
    })

    // Relazioni trasversali con label opzionale
    edges.forEach(({ from, to, label }) => {
        if (label) {
            lines.push(`    ${from} -->|"${sanitizeMermaid(label)}"| ${to}`)
        } else {
            lines.push(`    ${from} --> ${to}`)
        }
    })

    return lines.join('\n')
}

// function jsonToMermaidFlowchart(content) {
//     const contentMap = typeof content === 'string' ? JSON.parse(content) : content
//     const center = sanitizeMermaid(contentMap?.center || contentMap?.root || 'Mappa')
//     const nodes = contentMap?.nodes || []
//
//     const lines = ['flowchart TD', `    root["${center}"]`]
//
//     nodes.forEach((node, i) => {
//         const clean = sanitizeMermaid(node)
//         if (clean) {
//             lines.push(`    n${i}["${clean}"]`)
//             lines.push(`    root --> n${i}`)
//         }
//     })
//
//     return lines.join('\n')
// }

export default function MermaidDiagram({ content }) {
    const ref = useRef(null)
    const id = useRef(`mermaid-${Math.random().toString(36).slice(2)}`)

    useEffect(() => {
        if (!ref.current || !content) return

        let chart
        try {
            chart = jsonToMermaidFlowchart(content)
            console.log('[Mermaid chart]', chart)
        } catch {
            console.log('[Mermaid chart]', chart)
            return
        }

        mermaid.render(id.current, chart)
        mermaid.render(id.current, chart)
            .then(({ svg }) => {
                if (ref.current) {
                    ref.current.innerHTML = svg
                    // Forza dimensioni sull'SVG generato
                    const svgEl = ref.current.querySelector('svg')
                    if (svgEl) {
                        svgEl.style.width = '100%'
                        svgEl.style.height = 'auto'
                        svgEl.style.minHeight = '400px'
                    }
                }
            }).catch(err => console.error('[Mermaid]', err))

    }, [content])

    const handleDownloadPng = () => {
        const svg = ref.current?.querySelector('svg')
        if (!svg) return

        // Clona l'SVG e imposta dimensioni esplicite
        const cloned = svg.cloneNode(true)
        const bbox = svg.getBoundingClientRect()
        cloned.setAttribute('width', bbox.width)
        cloned.setAttribute('height', bbox.height)
        cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

        const svgString = new XMLSerializer().serializeToString(cloned)
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)

        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const scale = 2 // per retina/alta qualità
            canvas.width = bbox.width * scale
            canvas.height = bbox.height * scale

            const ctx = canvas.getContext('2d')
            ctx.scale(scale, scale)
            ctx.fillStyle = '#1f2937' // sfondo scuro coerente col tema
            ctx.fillRect(0, 0, bbox.width, bbox.height)
            ctx.drawImage(img, 0, 0)

            canvas.toBlob(blob => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'mappa.png'
                a.click()
            })
            URL.revokeObjectURL(url)
        }
        img.src = url
    }

    return (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
            <div className="message-content text-sm text-gray-100 leading-relaxed">
                <div ref={ref}
                     className="w-full overflow-auto p-4"
                     style={{ minHeight: '400px' }}
                />
                <div className="px-4 pb-3">
                    <button
                        onClick={handleDownloadPng}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700/60 hover:bg-gray-700 border border-gray-600/40 text-gray-300 hover:text-white text-xs font-medium transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Salva come PNG
                    </button>
                </div>
            </div>
        </div>
    )
}