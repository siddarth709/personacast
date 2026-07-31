const STORAGE_KEY = 'personacast_profiles'

export function loadProfiles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
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
