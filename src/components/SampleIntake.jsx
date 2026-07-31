import { useState } from 'react'

export default function SampleIntake({ onAnalyze, isAnalyzing }) {
    const [text, setText] = useState('')
    const [fileName, setFileName] = useState(null)

    async function handleFileUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        const validTypes = ['.txt', '.md', '.markdown']
        const isValid = validTypes.some((ext) => file.name.toLowerCase().endsWith(ext))
        if (!isValid) {
            alert('Please upload a .txt or .md file for now — PDF and other formats are on the roadmap.')
            return
        }

        const content = await file.text()
        setText((prev) => (prev ? prev + '\n\n' + content : content))
        setFileName(file.name)
    }

    return (
        <section className="panel intake">
            <p className="eyebrow">01 — bring your own writing</p>
            <h1>Paste a few things you've written.</h1>
            <p className="lede">
                Old blog posts, lyrics, a script, anything — a few hundred words is
                enough. PersonaCast reads for how you actually sound, not what you
                wrote about.
            </p>
            <div className="landing-capabilities">
                <span className="cap-pill">✍️ Freeform Generation</span>
                <span className="cap-pill">✉️ Email Reply Drafts</span>
                <span className="cap-pill">🎭 Multi-Persona Blending</span>
                <span className="cap-pill">🔍 Voice Drift Check</span>
            </div>

            <div className="file-upload-row">
                <label className="file-upload-btn">
                    + upload a .txt or .md file
                    <input type="file" accept=".txt,.md,.markdown" onChange={handleFileUpload} hidden />
                </label>
                {fileName && <span className="file-name">added: {fileName}</span>}
            </div>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your writing samples here, or upload a file above..."
                rows={12}
            />
            <button
                className="primary-btn"
                disabled={text.trim().length < 200 || isAnalyzing}
                onClick={() => onAnalyze(text)}
            >
                {isAnalyzing ? 'listening…' : 'Find my voice'}
            </button>
            {text.trim().length > 0 && text.trim().length < 200 && (
                <p className="hint">a little more — about {200 - text.trim().length} characters to go</p>
            )}
        </section>
    )
}