import { useState } from 'react'
import { replyToEmail } from '../lib/graniteClient.js'

const TONES = ['Neutral', 'Formal', 'Friendly', 'Direct', 'Apologetic', 'Persuasive', 'Warm']

const GmailLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#EA4335" />
        <path d="M12 13L2 6V18H5V9.5L12 14.5L19 9.5V18H22V6L12 13Z" fill="#4285F4" />
        <path d="M4 20H8V11L4 8V20Z" fill="#34A853" />
        <path d="M20 20H16V11L20 8V20Z" fill="#FBBC05" />
    </svg>
)

const OutlookLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 17.5L10.5 21V3L1 6.5V17.5Z" fill="#0078D4" />
        <path d="M10.5 4L22.5 2V22L10.5 20V4Z" fill="#28A8EA" />
        <path d="M6 10.5C4.6 10.5 3.5 11.6 3.5 13C3.5 14.4 4.6 15.5 6 15.5C7.4 15.5 8.5 14.4 8.5 13C8.5 11.6 7.4 10.5 6 10.5Z" fill="#FFFFFF" />
    </svg>
)

const AppleMailLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="url(#appleGrad)" />
        <path d="M4 7L12 13L20 7V17C20 17.55 19.55 18 19 18H5C4.45 18 4 17.55 4 17V7Z" fill="white" fillOpacity="0.9" />
        <path d="M20 6L12 12L4 6H20Z" fill="white" />
        <defs>
            <linearGradient id="appleGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </svg>
)

const ProtonLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V12C4 17 7.5 21.3 12 22.5C16.5 21.3 20 17 20 12V6L12 2Z" fill="#6D4AFF" />
        <path d="M12 6L7 9.5V14.5L12 18L17 14.5V9.5L12 6Z" fill="#FFFFFF" fillOpacity="0.8" />
    </svg>
)

const CustomApiLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="5" fill="#1E293B" />
        <path d="M7 9L4 12L7 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 9L20 12L17 15" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 7L10 17" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

const PROVIDERS = [
    {
        id: 'gmail',
        name: 'Gmail (Google Workspace API)',
        logo: <GmailLogo />,
        defaultEmail: 'nss.siddarth@gmail.com',
        authType: 'OAuth 2.0 Google Sign-In'
    },
    {
        id: 'outlook',
        name: 'Microsoft Outlook / Office 365',
        logo: <OutlookLogo />,
        defaultEmail: 'siddarth.work@outlook.com',
        authType: 'Microsoft Graph OAuth 2.0'
    },
    {
        id: 'apple',
        name: 'Apple Mail / iCloud IMAP',
        logo: <AppleMailLogo />,
        defaultEmail: 'siddarth@icloud.com',
        authType: 'App-Specific Password / IMAP'
    },
    {
        id: 'proton',
        name: 'ProtonMail Encrypted Bridge',
        logo: <ProtonLogo />,
        defaultEmail: 'siddarth@protonmail.com',
        authType: 'TLS Bridge Key'
    },
    {
        id: 'custom',
        name: 'Custom Webhook / REST API',
        logo: <CustomApiLogo />,
        defaultEmail: 'api-inbox@internal.net',
        authType: 'Bearer API Token'
    }
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
    const [connectedAccounts, setConnectedAccounts] = useState({
        gmail: 'nss.siddarth@gmail.com',
        outlook: null,
        apple: null,
        proton: null,
        custom: null
    })
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authTokenInput, setAuthTokenInput] = useState('')
    const [accountEmailInput, setAccountEmailInput] = useState('')
    const [subject, setSubject] = useState('')
    const [incomingEmail, setIncomingEmail] = useState('')
    const [replyIntent, setReplyIntent] = useState('')
    const [tone, setTone] = useState('Neutral')
    const [reply, setReply] = useState(null)
    const [isFetchingMail, setIsFetchingMail] = useState(false)
    const [fetchStatus, setFetchStatus] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState(null)
    const [copied, setCopied] = useState(false)

    const providerObj = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0]
    const connectedEmail = connectedAccounts[selectedProvider]

    function handleConnectAccount() {
        setAccountEmailInput(connectedEmail || providerObj.defaultEmail)
        setAuthTokenInput('')
        setShowAuthModal(true)
    }

    function handleSaveConnection() {
        const emailToSave = accountEmailInput.trim() || providerObj.defaultEmail
        setConnectedAccounts((prev) => ({ ...prev, [selectedProvider]: emailToSave }))
        setShowAuthModal(false)
        setFetchStatus(`🟢 Live connected: ${emailToSave} (${providerObj.name.split(' ')[0]})`)
    }

    function handleDisconnectAccount() {
        setConnectedAccounts((prev) => ({ ...prev, [selectedProvider]: null }))
        setFetchStatus(null)
    }

    async function handleEmlFileUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const rawContent = await file.text()
            const parsed = parseEml(rawContent)
            if (parsed.subject) setSubject(parsed.subject)
            setIncomingEmail(parsed.body)
            setFileName(file.name)
            setFetchStatus(`✓ Loaded real .eml file (${file.name}) ${parsed.from ? `from ${parsed.from}` : ''}`)
        } catch {
            alert('Could not parse email file.')
        }
    }

    async function handleLiveFetch() {
        if (!subject.trim()) return
        setIsFetchingMail(true)
        setFetchStatus(`Querying live ${providerObj.name.split(' ')[0]} mailbox...`)

        try {
            const res = await fetch('http://localhost:8787/api/fetch-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    provider: selectedProvider,
                    email: connectedEmail,
                    token: authTokenInput
                })
            })

            const data = await res.json()
            if (data.body) {
                setIncomingEmail(data.body)
                setFetchStatus(`✓ Fetched live email from ${data.from || connectedEmail || 'Inbox'}`)
            } else if (!connectedEmail) {
                setFetchStatus(`ℹ Please click "Connect Account" to authenticate ${providerObj.name.split(' ')[0]} live.`)
            } else {
                setFetchStatus(`No mail found on ${providerObj.name.split(' ')[0]} for "${subject}".`)
            }
        } catch (err) {
            console.error('Fetch mail error:', err)
            setFetchStatus(`Error querying server: ${err.message || 'Connection failed'}`)
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
                    <p className="eyebrow">05 — live email integration</p>
                    <h2>Reply to real emails in your voice</h2>
                </div>
                <div className="provider-status-badge">
                    {connectedEmail ? (
                        <span className="badge-connected">
                            <span className="live-dot-green">●</span> {connectedEmail}
                        </span>
                    ) : (
                        <button className="badge-connect-btn" onClick={handleConnectAccount}>
                            + Connect {providerObj.name.split(' ')[0]}
                        </button>
                    )}
                </div>
            </header>

            {/* Provider Cards Selector */}
            <div className="provider-cards-grid">
                {PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.id
                    const isConn = !!connectedAccounts[p.id]
                    return (
                        <button
                            key={p.id}
                            className={`provider-card-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedProvider(p.id)}
                        >
                            <span className="provider-logo-icon">{p.logo}</span>
                            <div className="provider-info">
                                <span className="provider-card-name">{p.name.split(' ')[0]}</span>
                                <span className="provider-card-status">
                                    {isConn ? '🟢 Active' : 'Connect'}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="modern-grid">
                {/* Left Column: Connection & Live Query */}
                <div className="replier-card-left">
                    <div className="connection-box">
                        <div className="connection-header">
                            <div className="brand-title">
                                {providerObj.logo}
                                <span>{providerObj.name}</span>
                            </div>
                            {connectedEmail ? (
                                <button className="text-btn disconnect-btn" onClick={handleDisconnectAccount}>
                                    Disconnect
                                </button>
                            ) : (
                                <button className="connect-action-btn" onClick={handleConnectAccount}>
                                    Authenticate & Connect
                                </button>
                            )}
                        </div>

                        {connectedEmail && (
                            <p className="connection-email-tag">
                                Connected as <strong>{connectedEmail}</strong> ({providerObj.authType})
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="field-label">Search Live Mailbox by Subject</label>
                        <div className="live-fetch-row">
                            <input
                                type="text"
                                className="subject-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Q3 Roadmap Review, Budget Approval..."
                            />
                            <button
                                className="secondary-btn fetch-btn"
                                onClick={handleLiveFetch}
                                disabled={isFetchingMail || !subject.trim()}
                            >
                                {isFetchingMail ? 'querying…' : 'Fetch Mail'}
                            </button>
                        </div>
                    </div>

                    {fetchStatus && (
                        <p className={`fetch-status ${fetchStatus.startsWith('✓') || fetchStatus.startsWith('🟢') ? 'success' : 'loading'}`}>
                            {fetchStatus}
                        </p>
                    )}

                    <div className="divider-row">
                        <span>or upload real file</span>
                    </div>

                    <div className="email-ingest-actions">
                        <label className="file-upload-btn">
                            📂 Upload Real Email (.eml / .msg / .txt)
                            <input type="file" accept=".eml,.txt,.msg,.markdown" onChange={handleEmlFileUpload} hidden />
                        </label>
                        {fileName && <span className="file-name">Loaded: {fileName}</span>}
                    </div>
                </div>

                {/* Right Column: Mail Content & Reply Intent */}
                <div className="replier-card-right">
                    <div className="form-group">
                        <label className="field-label">Incoming Email Body</label>
                        <textarea
                            value={incomingEmail}
                            onChange={(e) => setIncomingEmail(e.target.value)}
                            placeholder="Mail content will populate automatically when fetched or uploaded above..."
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

            {/* Modal for OAuth / Account Connect */}
            {showAuthModal && (
                <div className="auth-modal-overlay">
                    <div className="auth-modal-card">
                        <div className="auth-modal-header">
                            {providerObj.logo}
                            <h3>Connect to {providerObj.name}</h3>
                        </div>
                        <p className="auth-modal-desc">
                            Authenticate with your {providerObj.authType} to enable direct live inbox queries in PersonaCast.
                        </p>

                        <div className="auth-form">
                            <label>Account Email</label>
                            <input
                                type="email"
                                value={accountEmailInput}
                                onChange={(e) => setAccountEmailInput(e.target.value)}
                                placeholder="e.g. yourname@domain.com"
                            />

                            <label>API Key / OAuth Access Token (Optional)</label>
                            <input
                                type="password"
                                value={authTokenInput}
                                onChange={(e) => setAuthTokenInput(e.target.value)}
                                placeholder="Paste token or leave blank to use OAuth session"
                            />
                        </div>

                        <div className="auth-modal-footer">
                            <button className="text-btn" onClick={() => setShowAuthModal(false)}>
                                Cancel
                            </button>
                            <button className="primary-btn" onClick={handleSaveConnection}>
                                ✓ Confirm & Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
