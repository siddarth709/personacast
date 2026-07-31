import { useState } from 'react'
import { replyToEmail } from '../lib/graniteClient.js'

const TONES = ['Neutral', 'Formal', 'Friendly', 'Direct', 'Apologetic', 'Persuasive', 'Warm']

function parseEml(rawText) {
    const lines = rawText.split(/\r?\n/)
    let subject = ''
    let from = ''
    let bodyStartIndex = -1

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() === '' && bodyStartIndex === -1) {
            bodyStartIndex = i + 1
            break
        }
        if (line.toLowerCase().startsWith('subject:')) {
            subject = line.substring(8).trim()
        }
        if (line.toLowerCase().startsWith('from:')) {
            from = line.substring(5).trim()
        }
    }

    const body = bodyStartIndex !== -1 && bodyStartIndex < lines.length
        ? lines.slice(bodyStartIndex).join('\n').trim()
        : rawText

    return { subject, from, body }
}

export default function EmailReplier({ voiceProfile }) {
    const [subject, setSubject] = useState('')
    const [incomingEmail, setIncomingEmail] = useState('')
    const [replyIntent, setReplyIntent] = useState('')
    const [tone, setTone] = useState('Neutral')
    const [reply, setReply] = useState(null)
    const [apiEndpoint, setApiEndpoint] = useState('')
    const [apiToken, setApiToken] = useState('')
    const [isFetchingMail, setIsFetchingMail] = useState(false)
    const [fetchStatus, setFetchStatus] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState(null)

    async function handleEmlFileUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const rawContent = await file.text()
            const parsed = parseEml(rawContent)
            if (parsed.subject) setSubject(parsed.subject)
            setIncomingEmail(parsed.body)
            setFileName(file.name)
            setFetchStatus(`✓ Loaded real email file (${file.name}) ${parsed.from ? `from ${parsed.from}` : ''}`)
        } catch {
            alert('Could not parse email file.')
        }
    }

    async function handleLiveFetch() {
        if (!subject.trim()) return
        setIsFetchingMail(true)
        setFetchStatus('Connecting to live email server…')

        try {
            const res = await fetch('http://localhost:8787/api/fetch-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, apiEndpoint, token: apiToken })
            })

            const data = await res.json()
            if (data.body) {
                setIncomingEmail(data.body)
                setFetchStatus(`✓ Fetched live mail from ${data.from || 'Inbox'}`)
            } else if (data.status === 'no_live_credentials') {
                setFetchStatus('ℹ Connect a live Gmail/Outlook API endpoint below, or upload a real .eml file above.')
            } else {
                setFetchStatus('No live mail found for this subject.')
            }
        } catch (err) {
            setFetchStatus('Error connecting to live email endpoint.')
        } finally {
            setIsFetchingMail(false)
        }
    }

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
            <p className="eyebrow">05 — reply to a real email, in your voice</p>

            <div className="email-ingest-actions">
                <label className="file-upload-btn">
                    📂 Upload real email (.eml / .txt)
                    <input type="file" accept=".eml,.txt,.msg,.markdown" onChange={handleEmlFileUpload} hidden />
                </label>
                {fileName && <span className="file-name">Loaded: {fileName}</span>}
            </div>

            <label className="field-label">search live inbox by subject</label>
            <div className="live-fetch-row">
                <input
                    type="text"
                    className="subject-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject line to query live server..."
                />
                <button
                    className="secondary-btn fetch-btn"
                    onClick={handleLiveFetch}
                    disabled={isFetchingMail || !subject.trim()}
                >
                    {isFetchingMail ? 'connecting…' : 'Fetch live mail'}
                </button>
            </div>

            {fetchStatus && (
                <p className={`fetch-status ${fetchStatus.startsWith('✓') ? 'success' : 'loading'}`}>
                    {fetchStatus}
                </p>
            )}

            <details className="live-config-accordion">
                <summary>⚙️ Live Inbox Server Config (Gmail / Outlook / Webhook API)</summary>
                <div className="config-fields">
                    <input
                        type="text"
                        placeholder="Live Email API Endpoint (e.g. https://api.yourdomain.com/v1/inbox)"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Bearer Token / Secret"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                    />
                </div>
            </details>

            <label className="field-label">incoming email body (real email text)</label>
            <textarea
                value={incomingEmail}
                onChange={(e) => setIncomingEmail(e.target.value)}
                placeholder="Paste real incoming email text here or upload .eml file above..."
                rows={6}
            />

            <label className="field-label">what your reply should say (your intent)</label>
            <textarea
                value={replyIntent}
                onChange={(e) => setReplyIntent(e.target.value)}
                placeholder="e.g. yes I can meet Thursday at 3pm, but not Friday. Also ask about the budget."
                rows={3}
            />

            <label className="field-label">reply tone</label>
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
