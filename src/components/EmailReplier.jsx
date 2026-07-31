import { useState } from 'react'
import { replyToEmail } from '../lib/graniteClient.js'

const TONES = ['Neutral', 'Formal', 'Friendly', 'Direct', 'Apologetic', 'Persuasive', 'Warm']

const PROVIDERS = [
    { id: 'gmail', name: 'Gmail (Google Workspace API)', icon: '📧', endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' },
    { id: 'outlook', name: 'Microsoft Outlook / Office 365', icon: '📬', endpoint: 'https://graph.microsoft.com/v1.0/me/messages' },
    { id: 'apple', name: 'Apple Mail / iCloud IMAP', icon: '🍎', endpoint: 'imap.mail.me.com:993' },
    { id: 'proton', name: 'ProtonMail Bridge', icon: '🛡️', endpoint: '127.0.0.1:1143' },
    { id: 'custom', name: 'Custom Webhook / REST API', icon: '⚡', endpoint: 'https://api.yourdomain.com/v1/inbox' }
]

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
    const [selectedProvider, setSelectedProvider] = useState('gmail')
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
    const [copied, setCopied] = useState(false)

    const providerObj = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0]

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
        setFetchStatus(`Connecting to ${providerObj.name}...`)

        try {
            const res = await fetch('http://localhost:8787/api/fetch-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    provider: selectedProvider,
                    apiEndpoint: apiEndpoint || providerObj.endpoint,
                    token: apiToken
                })
            })

            const data = await res.json()
            if (data.body) {
                setIncomingEmail(data.body)
                setFetchStatus(`✓ Fetched mail via ${providerObj.name} from ${data.from || 'Inbox'}`)
            } else if (data.status === 'no_live_credentials') {
                setFetchStatus(`ℹ ${providerObj.name} endpoint ready. Enter auth token in settings or upload a .eml file.`)
            } else {
                setFetchStatus(`No mail found on ${providerObj.name} for "${subject}".`)
            }
        } catch (err) {
            setFetchStatus(`Error connecting to ${providerObj.name} server.`)
        } finally {
            setIsFetchingMail(false)
        }
    }

    async function handleGenerate() {
        if (!voiceProfile || incomingEmail.trim().length === 0 || replyIntent.trim().length === 0) return
        setIsGenerating(true)
        setError(null)
        setCopied(false)
        try {
            const text = await replyToEmail(voiceProfile, incomingEmail, replyIntent, tone)
            setReply(text)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    function handleCopyReply() {
        if (!reply) return
        navigator.clipboard.writeText(reply)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section className="panel email-replier modern-replier">
            <header className="replier-header">
                <div>
                    <p className="eyebrow">05 — smart email replier</p>
                    <h2>Reply to emails in your voice</h2>
                </div>
                <div className="provider-badge">
                    <span className="live-dot">●</span> {providerObj.name.split(' ')[0]} Connected
                </div>
            </header>

            <div className="modern-grid">
                {/* Left Column: Provider & Search */}
                <div className="replier-card-left">
                    <div className="form-group">
                        <label className="field-label">Select Email Provider</label>
                        <div className="select-wrapper">
                            <select
                                className="provider-select"
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                            >
                                {PROVIDERS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.icon} {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="field-label">Fetch Mail by Subject Line</label>
                        <div className="live-fetch-row">
                            <input
                                type="text"
                                className="subject-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Q3 Roadmap Review, Meeting Reschedule..."
                            />
                            <button
                                className="secondary-btn fetch-btn"
                                onClick={handleLiveFetch}
                                disabled={isFetchingMail || !subject.trim()}
                            >
                                {isFetchingMail ? 'fetching…' : 'Fetch Mail'}
                            </button>
                        </div>
                    </div>

                    {fetchStatus && (
                        <p className={`fetch-status ${fetchStatus.startsWith('✓') ? 'success' : 'loading'}`}>
                            {fetchStatus}
                        </p>
                    )}

                    <div className="divider-row">
                        <span>or ingest file</span>
                    </div>

                    <div className="email-ingest-actions">
                        <label className="file-upload-btn">
                            📂 Upload Email (.eml / .txt)
                            <input type="file" accept=".eml,.txt,.msg,.markdown" onChange={handleEmlFileUpload} hidden />
                        </label>
                        {fileName && <span className="file-name">Loaded: {fileName}</span>}
                    </div>

                    <details className="live-config-accordion">
                        <summary>⚙️ Server & Token Credentials ({providerObj.name.split(' ')[0]})</summary>
                        <div className="config-fields">
                            <input
                                type="text"
                                placeholder={`Endpoint (${providerObj.endpoint})`}
                                value={apiEndpoint}
                                onChange={(e) => setApiEndpoint(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Bearer Token / OAuth Credentials"
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                            />
                        </div>
                    </details>
                </div>

                {/* Right Column: Mail Content & Reply Options */}
                <div className="replier-card-right">
                    <div className="form-group">
                        <label className="field-label">Incoming Email Body</label>
                        <textarea
                            value={incomingEmail}
                            onChange={(e) => setIncomingEmail(e.target.value)}
                            placeholder="Email content will auto-populate when fetched or uploaded above..."
                            rows={5}
                        />
                    </div>

                    <div className="form-group">
                        <label className="field-label">What your reply should say (Key Intent)</label>
                        <textarea
                            value={replyIntent}
                            onChange={(e) => setReplyIntent(e.target.value)}
                            placeholder="e.g. Confirm Thursday meeting at 3pm, ask for revised budget proposal."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="field-label">Reply Tone Register</label>
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
                    </div>

                    <button
                        className="primary-btn generate-reply-btn"
                        onClick={handleGenerate}
                        disabled={!voiceProfile || incomingEmail.trim().length === 0 || replyIntent.trim().length === 0 || isGenerating}
                    >
                        {isGenerating ? 'drafting reply…' : 'Draft reply in my voice'}
                    </button>
                </div>
            </div>

            {/* Generated Reply Card */}
            {reply && (
                <div className="result modern-result-card">
                    <div className="result-header">
                        <p className="eyebrow">drafted reply — {tone.toLowerCase()} register</p>
                        <button className="copy-btn" onClick={handleCopyReply}>
                            {copied ? '✓ Copied!' : '📋 Copy Draft'}
                        </button>
                    </div>
                    <div className="result-body">
                        <p className="result-text">{reply}</p>
                    </div>
                </div>
            )}

            {error && <p className="error">{error}</p>}
        </section>
    )
}
