export default function VoiceFingerprint({ profile, onContinue }) {
    if (!profile) return null

    const { tone_words, sentence_rhythm, recurring_phrases_or_habits, recurring_themes, signature_line } = profile

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

            {onContinue && (
                <button className="primary-btn" onClick={onContinue}>
                    Write something in this voice →
                </button>
            )}
        </section>
    )
}