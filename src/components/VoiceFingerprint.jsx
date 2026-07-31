import { useState } from 'react'

export default function VoiceFingerprint({ profile, onSave }) {
    if (!profile) return null

    const { tone_words, sentence_rhythm, recurring_phrases_or_habits, recurring_themes, signature_line } = profile
    const [voiceName, setVoiceName] = useState('')
    const [saved, setSaved] = useState(false)

    function handleSave() {
        if (!voiceName.trim()) return
        onSave(voiceName.trim())
        setSaved(true)
    }

    return (
        <section className="panel fingerprint">
            <p className="eyebrow">02 — your voice fingerprint</p>

            <div className="tone-cloud" aria-label="Tone traits">
                {tone_words?.map((word, i) => (
                    <span
                        key={word}
                        className="tone-word"
                        style={{
                            fontSize: `${1.6 - i * 0.18}rem`,
                            opacity: 1 - i * 0.12
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>

            {signature_line && (
                <blockquote className="signature-line">"{signature_line}"</blockquote>
            )}

            <div className="trait-grid">
                <div className="trait">
                    <p className="trait-label">rhythm</p>
                    <p className="trait-value">{sentence_rhythm}</p>
                </div>
                <div className="trait">
                    <p className="trait-label">habits</p>
                    <ul>
                        {recurring_phrases_or_habits?.map((h) => (
                            <li key={h}>{h}</li>
                        ))}
                    </ul>
                </div>
                <div className="trait">
                    <p className="trait-label">themes you return to</p>
                    <ul>
                        {recurring_themes?.map((t) => (
                            <li key={t}>{t}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Save voice inline */}
            {onSave && (
                <div className="save-voice-inline">
                    {saved ? (
                        <p className="save-success">✓ Voice saved! Use it above or start writing below.</p>
                    ) : (
                        <>
                            <p className="save-voice-label">Give this voice a name to save it:</p>
                            <div className="save-voice-row">
                                <input
                                    type="text"
                                    className="save-voice-input"
                                    value={voiceName}
                                    onChange={(e) => setVoiceName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    placeholder="e.g. My Tech Blog, Weekend Essays, Work Emails..."
                                    autoFocus
                                />
                                <button
                                    className="primary-btn save-voice-btn"
                                    onClick={handleSave}
                                    disabled={!voiceName.trim()}
                                >
                                    Save Voice
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    )
}