import { useState } from "react";

export function FlashCard({ content }) {
    const [flipped, setFlipped] = useState(false);
    const flashcardContent = JSON.parse(content);

    return (
        <div
            className="cursor-pointer select-none w-full max-w-md"
            style={{ perspective: '1200px' }}
            onClick={() => setFlipped(f => !f)}
        >
            <div
                className="relative"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '220px',
                }}
            >
                {/* Front */}
                <div
                    className="rounded-2xl p-6 flex flex-col"
                    style={{
                        backfaceVisibility: 'hidden',
                        minHeight: '220px',
                        background: 'linear-gradient(135deg, #003087 0%, #0057b8 100%)',
                        boxShadow: '0 8px 32px rgba(0, 48, 135, 0.4)',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span
                            className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                            style={{ color: '#F0A500', background: 'rgba(240,165,0,0.15)' }}
                        >
                            Domanda
                        </span>
                        <svg
                            className="w-4 h-4 opacity-30"
                            style={{ color: 'white' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>

                    <p className="text-white text-base font-medium leading-relaxed flex-1">
                        {flashcardContent.front}
                    </p>

                    <p className="text-white/35 text-xs mt-5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                        </svg>
                        Tocca per vedere la risposta
                    </p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 rounded-2xl p-6 flex flex-col"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, #111827 0%, #1e2a3a 100%)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(240,165,0,0.2)',
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span
                            className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                            style={{ color: '#F0A500', background: 'rgba(240,165,0,0.15)' }}
                        >
                            Risposta
                        </span>
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(240,165,0,0.15)' }}
                        >
                            <svg className="w-3.5 h-3.5" style={{ color: '#F0A500' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <p className="text-gray-100 text-base leading-relaxed flex-1">
                        {flashcardContent.back}
                    </p>

                    <p className="text-gray-600 text-xs mt-5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Tocca per girare
                    </p>
                </div>
            </div>
        </div>
    );
}
