import { useState, useMemo } from 'react'
import { findGenericPhrases } from '../lib/driftHeuristics.js'
import { checkVoiceDrift } from '../lib/graniteClient.js'


export default function DriftEditor({ voiceProfile }) {
    const [text, setText] = useState('')
    const [aiFlags, setAiFlags] = useState([])
    const [isChecking, setIsChecking] = useState(false)

    const localHits = useMemo(() => findGenericPhrases(text), [text])

    async function handleDeepCheck() {
        if (!voiceProfile || text.trim().length < 40) return
        setIsChecking(true)
        try {
            const { flagged_sentences } = await checkVoiceDrift(voiceProfile, text)
            setAiFlags(flagged_sentences)
        } catch (err) {
            console.error('Drift check failed:', err)
        } finally {
            setIsChecking(false)
        }
    }

    return (
        <section className="panel drift-editor">
            <p className="eyebrow">04 — write freely, catch drift as you go</p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Draft something here — generic AI phrases get flagged instantly as you type."
                rows={8}
            />

            {localHits.length > 0 && (
                <p className="drift-instant">
                    ⚠ {localHits.length} generic phrase{localHits.length > 1 ? 's' : ''} spotted:{' '}
                    {localHits.map((h) => `"${h.phrase}"`).join(', ')}
                </p>
            )}

            <button
                className="primary-btn"
                onClick={handleDeepCheck}
                disabled={!voiceProfile || text.trim().length < 40 || isChecking}
            >
                {isChecking ? 'checking tone…' : 'Deep check against my voice'}
            </button>

            {aiFlags.length > 0 && (
                <div className="drift-deep-results">
                    <p className="eyebrow">off-tone sentences</p>
                    <ul>
                        {aiFlags.map((f, i) => (
                            <li key={i}>
                                <span className="flagged-sentence">"{f.sentence}"</span>
                                <span className="flag-reason">— {f.reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {aiFlags.length === 0 && text.trim().length >= 40 && !isChecking && (
                <p className="hint">Run a deep check to compare against your saved voice profile.</p>
            )}
        </section>
    )
}