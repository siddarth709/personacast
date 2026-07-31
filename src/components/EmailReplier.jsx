import { useState } from 'react'
import { replyToEmail } from '../lib/graniteClient.js'

const TONES = ['Neutral', 'Formal', 'Friendly', 'Direct', 'Apologetic', 'Persuasive', 'Warm']

const MOCK_INBOX = [
    {
        subject: 'Q3 Strategy Sync',
        from: 'Sarah Chen (Product Director)',
        body: `Hi team,

Following up on our Q3 roadmap review. We need to align on whether we're prioritizing the new mobile API endpoints or the analytics dashboard revamp first. Could you send over your thoughts and availability for a quick sync this week?

Best regards,
Sarah Chen`
    },
    {
        subject: 'Rescheduling Thursday Meeting',
        from: 'Dave Miller (Engineering Lead)',
        body: `Hey there,

Something urgent came up for Friday afternoon so I won't be able to make our 2 PM check-in. Would Thursday at 3 PM or next Monday morning work better on your end?

Thanks,
Dave`
    },
    {
        subject: 'Q4 Budget Approval',
        from: 'Elena Rostova (Finance)',
        body: `Hi Siddarth,

I reviewed the Q4 software & tooling proposal you submitted. The numbers look reasonable overall, but finance needs a quick breakdown on the $1,200 cloud infrastructure item before signing off. Can you clarify that part?

Regards,
Elena`
    },
    {
        subject: 'Project Status Update',
        from: 'Mark Vance (Client Success)',
        body: `Hi Siddarth,

Could you give us a quick status update on the PersonaCast integration milestones? The client is asking for an estimated delivery date for the beta release.

Best regards,
Mark`
    }
]

export default function EmailReplier({ voiceProfile }) {
    const [subject, setSubject] = useState('')
    const [incomingEmail, setIncomingEmail] = useState('')
    const [replyIntent, setReplyIntent] = useState('')
    const [tone, setTone] = useState('Neutral')
    const [reply, setReply] = useState(null)
    const [isFetchingMail, setIsFetchingMail] = useState(false)
    const [fetchStatus, setFetchStatus] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)

    function handleSubjectChange(val) {
        setSubject(val)
        if (val.trim().length === 0) {
            setFetchStatus(null)
            return
        }

        setIsFetchingMail(true)
        setFetchStatus('fetching mail from inbox…')

        setTimeout(() => {
            const normalized = val.toLowerCase()
            const match = MOCK_INBOX.find((item) =>
                item.subject.toLowerCase().includes(normalized) ||
                normalized.includes(item.subject.toLowerCase().split(' ')[0])
            )

            if (match) {
                setIncomingEmail(match.body)
                setFetchStatus(`✓ Auto-fetched mail from ${match.from}`)
            } else {
                setIncomingEmail(`Hi,\n\nFollowing up regarding "${val}". Could you please share your latest updates and availability on this?\n\nBest regards,\nSender`)
                setFetchStatus(`✓ Auto-generated email body for subject "${val}"`)
            }
            setIsFetchingMail(false)
        }, 300)
    }

    function handleSelectPresetSubject(preset) {
        setSubject(preset.subject)
        setIncomingEmail(preset.body)
        setFetchStatus(`✓ Auto-fetched mail from ${preset.from}`)
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
            <p className="eyebrow">05 — reply to an email, in your voice</p>

            <label className="field-label">email subject (enter to auto-fetch mail)</label>
            <input
                type="text"
                className="subject-input"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Type or select a subject (e.g. Q3 Strategy Sync, Meeting Reschedule)..."
            />

            <div className="preset-subjects">
                <span className="preset-label">Quick Inbox Subjects:</span>
                {MOCK_INBOX.map((item) => (
                    <button
                        key={item.subject}
                        className={`preset-chip ${subject === item.subject ? 'active' : ''}`}
                        onClick={() => handleSelectPresetSubject(item)}
                    >
                        📩 {item.subject}
                    </button>
                ))}
            </div>

            {fetchStatus && (
                <p className={`fetch-status ${isFetchingMail ? 'loading' : 'success'}`}>
                    {fetchStatus}
                </p>
            )}

            <label className="field-label">incoming email body (auto-populated)</label>
            <textarea
                value={incomingEmail}
                onChange={(e) => setIncomingEmail(e.target.value)}
                placeholder="Email body will auto-populate when subject is entered, or paste manually..."
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
