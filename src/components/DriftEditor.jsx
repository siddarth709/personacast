import { useState, useMemo } from 'react'
import { findGenericPhrases } from '../lib/driftHeuristics.js'
import { checkVoiceDrift, reVoiceFullText } from '../lib/graniteClient.js'

export default function DriftEditor({ voiceProfile }) {
    const [text, setText] = useState('')
    const [aiFlags, setAiFlags] = useState([])
    const [isChecking, setIsChecking] = useState(false)
    const [isRewriting, setIsRewriting] = useState(false)
    const [rewrittenResult, setRewrittenResult] = useState(null)
    const [copied, setCopied] = useState(false)

    const localHits = useMemo(() => findGenericPhrases(text), [text])

    async function handleDeepCheck() {
        if (!voiceProfile || text.trim().length < 20) return
        setIsChecking(true)
        setRewrittenResult(null)
        try {
            const { flagged_sentences } = await checkVoiceDrift(voiceProfile, text)
            setAiFlags(flagged_sentences)
        } catch (err) {
            console.error('Drift check failed:', err)
        } finally {
            setIsChecking(false)
        }
    }

    async function handleAutoRewrite() {
        if (!voiceProfile || text.trim().length === 0) return
        setIsRewriting(true)
        setCopied(false)
        try {
            const fixedText = await reVoiceFullText(voiceProfile, text, aiFlags)
            setRewrittenResult(fixedText)
        } catch (err) {
            console.error('Auto rewrite failed:', err)
        } finally {
            setIsRewriting(false)
        }
    }

    function handleCopyRewritten() {
        if (!rewrittenResult) return
        navigator.clipboard.writeText(rewrittenResult)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section className="panel drift-editor">
            <p className="eyebrow">04 — write freely, catch drift & auto-rewrite</p>
            <textarea
                value={text}
                onChange={(e) => {
                    setText(e.target.value)
                    setRewrittenResult(null)
                }}
                placeholder="Draft something here — generic AI phrases get flagged instantly as you type..."
                rows={8}
            />

            {localHits.length > 0 && (
                <p className="drift-instant">
                    ⚠ {localHits.length} generic phrase{localHits.length > 1 ? 's' : ''} spotted:{' '}
                    {localHits.map((h) => `"${h.phrase}"`).join(', ')}
                </p>
            )}

            <div className="drift-actions-row">
                <button
                    className="primary-btn"
                    onClick={handleDeepCheck}
                    disabled={!voiceProfile || text.trim().length < 20 || isChecking}
                >
                    {isChecking ? 'checking tone…' : 'Deep check against my voice'}
                </button>

                {text.trim().length > 20 && (
                    <button
                        className="secondary-btn rewrite-btn"
                        onClick={handleAutoRewrite}
                        disabled={!voiceProfile || isRewriting}
                    >
                        {isRewriting ? 'rewriting in my voice…' : '✨ Fix Voice Drift & Rewrite'}
                    </button>
                )}
            </div>

            {aiFlags.length > 0 && (
                <div className="drift-deep-results">
                    <div className="flags-header">
                        <p className="eyebrow">off-tone sentences ({aiFlags.length} flagged)</p>
                    </div>
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

            {/* Rewritten Draft Result */}
            {rewrittenResult && (
                <div className="result modern-result-card rewritten-card">
                    <div className="result-header">
                        <p className="eyebrow">rewritten version — voice drift corrected</p>
                        <button className="copy-btn" onClick={handleCopyRewritten}>
                            {copied ? '✓ Copied!' : '📋 Copy Rewritten Text'}
                        </button>
                    </div>
                    <div className="result-body">
                        <p className="result-text">{rewrittenResult}</p>
                    </div>
                </div>
            )}

            {aiFlags.length === 0 && text.trim().length >= 20 && !isChecking && !rewrittenResult && (
                <p className="hint">Run a deep check to compare against your saved voice profile, or click Rewrite to fix any drift.</p>
            )}
        </section>
    )
}