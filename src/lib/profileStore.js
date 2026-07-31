const STORAGE_KEY = 'personacast_profiles'

const DEMO_PROFILES = [
    {
        id: 'demo-tech-joan',
        name: 'Technical Blogger (Joan)',
        sourceSample: 'I built a lightweight RAG pipeline in Node.js last weekend. No vector database, just word overlap scoring. It works surprisingly well for small documents.',
        createdAt: new Date().toISOString(),
        profile: {
            tone_words: ['candid', 'pragmatic', 'technical'],
            sentence_rhythm: 'Direct, clear sentences with occasional informal aside.',
            recurring_phrases_or_habits: ['under the hood', 'turns out', 'no fluff'],
            recurring_themes: ['software architecture', 'building simply', 'developer experience'],
            signature_line: 'Keep it simple, test it early, ship it.'
        }
    },
    {
        id: 'demo-casual-marcus',
        name: 'Casual Storyteller (Marcus)',
        sourceSample: 'Rain was coming down hard over the neon sign of the diner. I grabbed a tepid coffee and wondered where the last three years went.',
        createdAt: new Date().toISOString(),
        profile: {
            tone_words: ['wry', 'reflective', 'vivid'],
            sentence_rhythm: 'Lyrical imagery alternating with punchy observations.',
            recurring_phrases_or_habits: ['use of em-dashes', 'sensory details', 'quiet humor'],
            recurring_themes: ['urban solitude', 'passing time', 'nostalgia'],
            signature_line: 'The rain fell like an unread letter.'
        }
    }
]

export function loadProfiles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PROFILES))
        return DEMO_PROFILES
    } catch {
        return DEMO_PROFILES
    }
}

export function saveProfile(name, profile, sourceSample) {
    const profiles = loadProfiles()
    const entry = {
        id: crypto.randomUUID(),
        name,
        profile,
        sourceSample,
        createdAt: new Date().toISOString()
    }
    const updated = [...profiles, entry]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
}

export function deleteProfile(id) {
    const updated = loadProfiles().filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
}
