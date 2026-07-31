import { useState } from 'react'
import InlineReVoicer from './InlineReVoicer.jsx'
import { retrieveRelevantSnippets } from '../lib/styleRag.js'

export default function GenerationPanel({ onGenerate, isGenerating, result, voiceProfile, onResultChange, activeSample }) {
    const [instruction, setInstruction] = useState('')
    const [wordCount, setWordCount] = useState(150)
    const [facts, setFacts] = useState('')
    const [usedSnippets, setUsedSnippets] = useState([])
    const [isFetchingSpecs, setIsFetchingSpecs] = useState(false)
    const [specStatus, setSpecStatus] = useState(null)
    const [factsOpen, setFactsOpen] = useState(false)

    async function handleFetchSpecs() {
        if (!instruction.trim()) return
        setIsFetchingSpecs(true)
        setSpecStatus('Fetching verified technical specs...')
        setFactsOpen(true)

        try {
            const res = await fetch('http://localhost:8787/api/fetch-specs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: instruction })
            })

            const data = await res.json()
            if (data.specs) {
                setFacts(data.specs)
                setSpecStatus(`✓ Auto-fetched verified specs for "${instruction.trim()}"`)
            }
        } catch {
            setSpecStatus('Could not auto-fetch specs. Paste facts manually below.')
        } finally {
            setIsFetchingSpecs(false)
        }
    }

    function handleSubmit() {
        const snippets = activeSample ? retrieveRelevantSnippets(activeSample, instruction, 3) : []
        setUsedSnippets(snippets)
        onGenerate(instruction, snippets, wordCount, facts)
    }

    return (
        <section className="panel generation">
            <p className="eyebrow">03 — put it to work</p>
            <h2>What do you want to write?</h2>
            
            <div className="topic-input-row">
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. A review on toyota hilux, iPhone 16 Pro comparison, or an essay on urban architecture"
                    rows={3}
                />
            </div>

            <div className="specs-action-bar">
                <button
                    className="secondary-btn fetch-specs-btn"
                    onClick={handleFetchSpecs}
                    disabled={isFetchingSpecs || !instruction.trim()}
                >
                    {isFetchingSpecs ? 'fetching specs…' : '⚡ Auto-Fetch Specs & Technical Facts'}
                </button>
            </div>

            {specStatus && (
                <p className={`fetch-status ${specStatus.startsWith('✓') ? 'success' : 'loading'}`}>
                    {specStatus}
                </p>
            )}

            <details className="facts-input" open={factsOpen} onToggle={(e) => setFactsOpen(e.target.open)}>
                <summary>+ real facts/data grounding {facts ? ' (Specs Loaded)' : '(optional)'}</summary>
                <textarea
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder="e.g. Specs, dates, prices, engine outputs, or numbers to strictly ground the generation in..."
                    rows={6}
                />
                <p className="hint">
                    PersonaCast grounds its output strictly in these verified specs — preventing invented or inaccurate numbers.
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