import {useState} from "react";


export function FlashCard({content}) {
    const [flipped, setFlipped] = useState(false)

    const flashcardContent = JSON.parse(content)

    return (
        <div
            className="cursor-pointer select-none"
            style={{perspective: '1000px'}}
            onClick={() => setFlipped(f => !f)}
        >
            <div
                className="relative transition-transform duration-500"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '180px'
                }}
            >
                <div
                    className="rounded-2xl border border-gray-700/60 bg-gray-900/80 p-5 flex flex-col justify-between"
                    style={{backfaceVisibility: 'hidden', minHeight: '180px'}}
                >
                    <p className="text-gray-100 text-sm font-medium leading-relaxed">
                        {flashcardContent.front}
                    </p>
                    <p className="text-gray-500 text-xs mt-3">Tocca per vedere la risposta</p>
                </div>

                <div
                    className="absolute inset-0 rounded-2xl border border-gray-700/60 bg-gray-900/80 p-5 flex flex-col justify-between"
                    style={{backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}
                >
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {flashcardContent.back}
                    </p>
                    <p className="text-gray-500 text-xs mt-3">Tocca per girare</p>
                </div>
            </div>
        </div>
    )
}