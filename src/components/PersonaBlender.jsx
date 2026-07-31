import { useState } from 'react'
import { generateBlendedVoice } from '../lib/graniteClient.js'

export default function PersonaBlender({ savedProfiles }) {
    const [selectedIds, setSelectedIds] = useState([])
    const [weights, setWeights] = useState({})
    const [instruction, setInstruction] = useState('')
    const [wordCount, setWordCount] = useState(150)
    const [result, setResult] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)

    function distributeEqually(ids) {
        if (ids.length === 0) return {}
        const equalShare = Math.floor(100 / ids.length)
        const remainder = 100 - (equalShare * ids.length)
        const newWeights = {}
        ids.forEach((id, idx) => {
            newWeights[id] = equalShare + (idx === 0 ? remainder : 0)
        })
        return newWeights
    }

    function toggleProfile(id) {
        let updated
        if (selectedIds.includes(id)) {
            updated = selectedIds.filter((sid) => sid !== id)
        } else if (selectedIds.length < 3) {
            updated = [...selectedIds, id]
        } else {
            return
        }
        setSelectedIds(updated)
        setWeights(distributeEqually(updated))
    }

    function updateWeight(id, value) {
        setWeights((w) => ({ ...w, [id]: Number(value) }))
    }

    function autoBalance() {
        if (selectedIds.length === 0) return
        const sum = selectedIds.reduce((acc, id) => acc + (weights[id] || 0), 0)
        if (sum === 0) {
            setWeights(distributeEqually(selectedIds))
            return
        }
        let runningTotal = 0
        const newWeights = {}
        selectedIds.forEach((id, idx) => {
            if (idx === selectedIds.length - 1) {
                newWeights[id] = Math.max(0, 100 - runningTotal)
            } else {
                const normalized = Math.round(((weights[id] || 0) / sum) * 100)
                newWeights[id] = normalized
                runningTotal += normalized
            }
        })
        setWeights(newWeights)
    }

    const totalWeight = selectedIds.reduce((sum, id) => sum + (weights[id] || 0), 0)

    async function handleGenerate() {
        if (selectedIds.length < 2 || instruction.trim().length === 0) return
        setIsGenerating(true)
        setError(null)
        try {
            const weightedProfiles = selectedIds.map((id) => {
                const saved = savedProfiles.find((p) => p.id === id)
                return { name: saved.name, profile: saved.profile, weight: weights[id] }
            })
            const text = await generateBlendedVoice(weightedProfiles, instruction, wordCount)
            setResult(text)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    if (savedProfiles.length < 2) {
        return (
            <section className="panel blender">
                <p className="eyebrow">persona blending</p>
                <p className="hint">Save at least two voices to blend them together.</p>
            </section>
        )
    }

    return (
        <section className="panel blender">
            <p className="eyebrow">blend up to 3 saved voices</p>

            <div className="blend-selector">
                {savedProfiles.map((p) => (
                    <button
                        key={p.id}
                        className={`blend-chip ${selectedIds.includes(p.id) ? 'active' : ''}`}
                        onClick={() => toggleProfile(p.id)}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {selectedIds.map((id) => {
                const saved = savedProfiles.find((p) => p.id === id)
                return (
                    <div key={id} className="blend-slider-row">
                        <label>{saved.name}</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={weights[id] ?? 0}
                            onChange={(e) => updateWeight(id, e.target.value)}
                        />
                        <span className="blend-weight">{weights[id] ?? 0}%</span>
                    </div>
                )
            })}

            {selectedIds.length >= 2 && (
                <div className="blend-total-row">
                    <p className={`hint ${totalWeight !== 100 ? 'warn' : ''}`}>
                        Total: {totalWeight}% {totalWeight === 100 ? '✓' : ''}
                    </p>
                    {totalWeight !== 100 && (
                        <button className="text-btn balance-btn" onClick={autoBalance}>
                            Auto-balance to 100%
                        </button>
                    )}
                </div>
            )}

            {selectedIds.length >= 2 && (
                <>
                    <textarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="What should the blended voice write?"
                        rows={3}
                    />

                    <div className="word-count-row">
                        <label htmlFor="blendWordCount">length: ~{wordCount} words</label>
                        <input
                            id="blendWordCount"
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
                        onClick={handleGenerate}
                    >
                        {isGenerating ? 'blending…' : 'Generate blended voice'}
                    </button>
                </>
            )}

            {result && (
                <div className="result">
                    <p className="eyebrow">result</p>
                    <p className="result-text">{result}</p>
                </div>
            )}

            {error && <p className="error">{error}</p>}
        </section>
    )
}
