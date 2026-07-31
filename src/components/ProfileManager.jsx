import { useState } from 'react'
import { saveProfile, deleteProfile } from '../lib/profileStore.js'

export default function ProfileManager({ activeProfile, activeSample, onSelectProfile, profiles, setProfiles }) {
    const [nameInput, setNameInput] = useState('')

    function handleSave() {
        if (!nameInput.trim() || !activeProfile) return
        const updated = saveProfile(nameInput.trim(), activeProfile, activeSample)
        setProfiles(updated)
        setNameInput('')
    }

    function handleDelete(id) {
        setProfiles(deleteProfile(id))
    }

    return (
        <section className="panel profile-manager">
            <p className="eyebrow">saved voices</p>

            {profiles.length === 0 && (
                <p className="hint">No saved voices yet — save your current one below, or build another from a new sample.</p>
            )}

            <ul className="profile-list">
                {profiles.map((p) => (
                    <li key={p.id} className="profile-item">
                        <button className="profile-select" onClick={() => onSelectProfile(p)}>
                            {p.name}
                        </button>
                        <button className="profile-delete" onClick={() => handleDelete(p.id)} aria-label={`Delete ${p.name}`}>
                            ×
                        </button>
                    </li>
                ))}
            </ul>

            {activeProfile && (
                <div className="save-current">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Technical Blog, Casual Newsletter..."
                    />
                    <button className="primary-btn" onClick={handleSave} disabled={!nameInput.trim()}>
                        Save this voice
                    </button>
                </div>
            )}
        </section>
    )
}