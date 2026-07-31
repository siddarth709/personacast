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
    { id: 'gmail', name: 'Gmail', logo: <GmailLogo /> },
    { id: 'outlook', name: 'Outlook', logo: <OutlookLogo /> },
    { id: 'apple', name: 'Apple Mail', logo: <AppleMailLogo /> },
    { id: 'proton', name: 'ProtonMail', logo: <ProtonLogo /> },
    { id: 'custom', name: 'Custom Mail', logo: <CustomApiLogo /> }
]

function cleanEmailBody(rawBody) {
    if (!rawBody) return ''
    let text = rawBody
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '')
    text = text.replace(/([a-z0-9_#.-]+\s*\{[^}]*\})/gi, '')
    text = text.replace(/<(br|p|div|tr|li)[^>]*>/gi, '\n')
    text = text.replace(/<[^>]+>/g, '')
    text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "'")
        .replace(/&lsquo;/gi, "'")
        .replace(/&rdquo;/gi, '"')
        .replace(/&ldquo;/gi, '"')
        .replace(/&mdash;/gi, '—')
        .replace(/&ndash;/gi, '–')

    text = text.split('\n')
        .filter((line) => {
            const trimmed = line.trim()
            if (trimmed.startsWith('Content-Type:') ||
                trimmed.startsWith('Content-Transfer-Encoding:') ||
                trimmed.startsWith('MIME-Version:') ||
                trimmed.startsWith('----=_NextPart') ||
                trimmed.startsWith('--_000_') ||
                trimmed.startsWith('boundary=')) {
                return false
            }
            return true
        })
        .join('\n')

    return text
        .split('\n')
        .map((l) => l.trim())
        .filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''))
        .join('\n')
        .trim()
}

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

    const rawBody = bodyStartIndex !== -1 && bodyStartIndex < lines.length
        ? lines.slice(bodyStartIndex).join('\n').trim()
        : rawText

    const body = cleanEmailBody(rawBody)

    return { subject, from, body }
}

export default function EmailReplier({ voiceProfile }) {
    const [selectedProvider, setSelectedProvider] = useState('gmail')
    const [subject, setSubject] = useState('')
    const [incomingEmail, setIncomingEmail] = useState('')
    const [replyIntent, setReplyIntent] = useState('')
    const [tone, setTone] = useState('Neutral')
    const [reply, setReply] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [fileName, setFileName] = useState(null)
    const [statusMsg, setStatusMsg] = useState(null)
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
            setStatusMsg(`✓ Uploaded real email file (${file.name}) ${parsed.from ? `from ${parsed.from}` : ''}`)
        } catch {
            alert('Could not parse email file.')
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
            </header>

            {/* Email Provider Selector Chips */}
            <div className="form-group">
                <label className="field-label">Target Email Format</label>
                <div className="provider-cards-grid">
                    {PROVIDERS.map((p) => {
                        const isSelected = selectedProvider === p.id
                        return (
                            <button
                                key={p.id}
                                className={`provider-card-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedProvider(p.id)}
                            >
                                <span className="provider-logo-icon">{p.logo}</span>
                                <span className="provider-card-name">{p.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* File Upload Bar */}
            <div className="form-group">
                <label className="field-label">Upload Real Email File</label>
                <div className="email-ingest-actions">
                    <label className="file-upload-btn">
                        📂 Upload Real Email (.eml / .msg / .txt)
                        <input type="file" accept=".eml,.txt,.msg,.markdown" onChange={handleEmlFileUpload} hidden />
                    </label>
                    {fileName && <span className="file-name">Loaded: {fileName}</span>}
                </div>
                {statusMsg && <p className="fetch-status success">{statusMsg}</p>}
            </div>

            {/* Incoming Email Text Area */}
            <div className="form-group">
                <label className="field-label">Incoming Email Content {subject ? `— Subject: ${subject}` : ''}</label>
                <textarea
                    value={incomingEmail}
                    onChange={(e) => setIncomingEmail(e.target.value)}
                    placeholder="Paste email content here or upload a .eml file above..."
                    rows={6}
                />
            </div>

            {/* Reply Intent */}
            <div className="form-group">
                <label className="field-label">What your reply should say (Key Points / Intent)</label>
                <textarea
                    value={replyIntent}
                    onChange={(e) => setReplyIntent(e.target.value)}
                    placeholder="e.g. Yes I can meet Thursday at 3pm, but not Friday. Also ask about the budget proposal."
                    rows={3}
                />
            </div>

            {/* Tone Selector */}
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
                {isGenerating ? 'drafting reply…' : `Draft ${providerObj.name} reply in my voice`}
            </button>

            {/* Draft Result View */}
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
