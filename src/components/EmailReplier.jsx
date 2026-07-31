import { useState } from 'react'
import { replyToEmail } from '../lib/graniteClient.js'

const TONES = ['Neutral', 'Formal', 'Friendly', 'Direct', 'Apologetic', 'Persuasive', 'Warm']

export default function EmailReplier({ voiceProfile }) {
    const [incomingEmail, setIncomingEmail] = useState('')
    const [replyIntent, setReplyIntent] = useState('')
    const [tone, setTone] = useState('Neutral')
    const [reply, setReply] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)

    async function handleGenerate() {
        if (!voiceProfile || incomingEmail.trim().length === 0 || replyIntent.trim().length === 0) return
        setIsGenerating(true)
        setError(null)
        try {
            const text = await replyToEmail(voiceProfile, incomingEmail, replyIntent, tone)
            setReply(text)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <section className="panel email-replier">
            <p className="eyebrow">05 — reply to an email, in your voice</p>

            <label className="field-label">the email you received</label>
            <textarea
                value={incomingEmail}
                onChange={(e) => setIncomingEmail(e.target.value)}
                placeholder="Paste the email you're replying to..."
                rows={6}
            />

            <label className="field-label">what your reply should say</label>
            <textarea
                value={replyIntent}
                onChange={(e) => setReplyIntent(e.target.value)}
                placeholder="e.g. yes I can meet Thursday at 3pm, but not Friday. Also ask about the budget."
                rows={3}
            />

            <label className="field-label">tone</label>
            <div className="tone-selector">
                {TONES.map((t) => (
                    <button
                        key={t}
                        className={`tone-chip ${tone === t ? 'active' : ''}`}
                        onClick={() => setTone(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <button
                className="primary-btn"
                onClick={handleGenerate}
                disabled={!voiceProfile || incomingEmail.trim().length === 0 || replyIntent.trim().length === 0 || isGenerating}
            >
                {isGenerating ? 'drafting…' : 'Draft reply in my voice'}
            </button>

            {reply && (
                <div className="result">
                    <p className="eyebrow">drafted reply — {tone.toLowerCase()}</p>
                    <p className="result-text">{reply}</p>
                </div>
            )}

            {error && <p className="error">{error}</p>}
        </section>
    )
}
