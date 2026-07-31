import { useState, useRef } from "react"
import { reVoiceSnippet } from "../lib/graniteClient"

export default function InlineReVoicer({ text, voiceProfile, onTextChange }) {
    const [selection, setSelection] = useState(null)
    const [isRevoicing, setIsRevoicing] = useState(false)
    const containerRef = useRef(null)

    function handleMouseUp() {
        const sel = window.getSelection()
        const selectedText = sel.toString().trim()

        if (!selectedText || selectedText.length < 3) {
            setSelection(null)
            return
        }

        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()

        const start = text.indexOf(selectedText)
        if (start === -1) {
            setSelection(null)
            return
        }

        setSelection({
            text: selectedText,
            start,
            end: start + selectedText.length,
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top
        })
    }

    async function handleRevoice() {
        if (!selection) return
        setIsRevoicing(true)
        try {
            const contextBefore = text.slice(Math.max(0, selection.start - 80), selection.start)
            const contextAfter = text.slice(selection.end, selection.end + 80)
            const rewritten = await reVoiceSnippet(
                voiceProfile,
                selection.text,
                `${contextBefore} [...] ${contextAfter}`
            )
            const newText = text.slice(0, selection.start) + rewritten.trim() + text.slice(selection.end)
            onTextChange(newText)
            setSelection(null)
            window.getSelection().removeAllRanges()
        } catch (err) {
            console.error('Re-voice failed:', err)
        } finally {
            setIsRevoicing(false)
        }
    }
    return (
        <div className="revoicer-container" ref={containerRef}>
            <p className="result-text" onMouseUp={handleMouseUp}>
                {text}
            </p>

            {selection && (
                <button
                    className="revoice-popup"
                    style={{ left: selection.x, top: selection.y - 40 }}
                    onClick={handleRevoice}
                    disabled={isRevoicing}
                >
                    {isRevoicing ? 'rewriting...' : 'Re-voice this ->'}
                </button>
            )}
        </div>
    )

}