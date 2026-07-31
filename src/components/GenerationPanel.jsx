import { useState } from 'react'
import InlineReVoicer from './InlineReVoicer.jsx'
import { retrieveRelevantSnippets } from '../lib/styleRag.js'

export default function GenerationPanel({ onGenerate, isGenerating, result, voiceProfile, onResultChange, activeSample }) {
    const [instruction, setInstruction] = useState('')
    const [wordCount, setWordCount] = useState(150)
    const [facts, setFacts] = useState('')
    const [usedSnippets, setUsedSnippets] = useState([])

    function handleSubmit() {
        const snippets = activeSample ? retrieveRelevantSnippets(activeSample, instruction, 3) : []
        setUsedSnippets(snippets)
        onGenerate(instruction, snippets, wordCount, facts)
    }

    return (
        <section className="panel generation">
            <p className="eyebrow">03 — put it to work</p>
            <h2>What do you want to write?</h2>
            <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. a short opening paragraph for a story about losing a train ticket"
                rows={3}
            />

            <details className="facts-input">
                <summary>+ add real facts/data to ground this in (optional)</summary>
                <textarea
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder="e.g. iPhone Air: 5.6mm thick, released Sept 2026, starts at $999, titanium frame..."
                    rows={4}
                />
                <p className="hint">
                    Paste specs, dates, prices, or numbers you've verified yourself. PersonaCast will use
                    only what you provide here — it won't invent facts to fill gaps.
                </p>
            </details>

            <div className="word-count-row">
                <label htmlFor="wordCount">length: ~{wordCount} words</label>
                <input
                    id="wordCount"
                    type="range"
                    min="30"
                    max="500"
                    step="10"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                />
            </div>

            <button
                className="primary-btn"
                disabled={instruction.trim().length === 0 || isGenerating}
                onClick={handleSubmit}
            >
                {isGenerating ? 'writing…' : 'Generate in my voice'}
            </button>

            {usedSnippets.length > 0 && (
                <details className="rag-snippets">
                    <summary>drew on {usedSnippets.length} real examples from your writing</summary>
                    <ul>
                        {usedSnippets.map((s, i) => (
                            <li key={i}>"{s}"</li>
                        ))}
                    </ul>
                </details>
            )}

            {result && (
                <div className="result">
                    <p className="eyebrow">result — highlight any part to re-voice it</p>
                    <InlineReVoicer text={result} voiceProfile={voiceProfile} onTextChange={onResultChange} />
                </div>
            )}
        </section>
    )
}