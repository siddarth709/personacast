const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to',
    'of', 'in', 'on', 'for', 'with', 'that', 'this', 'it', 'as', 'at', 'by',
    'be', 'i', 'my', 'me', 'you', 'your'
])

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function chunkIntoSnippets(sample) {
    return sample
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)
}

function overlapScore(snippetTokens, queryTokens) {
    const querySet = new Set(queryTokens)
    let matches = 0
    for (const tok of snippetTokens) {
        if (querySet.has(tok)) matches++
    }
    return matches
}


export function retrieveRelevantSnippets(sample, instruction, k = 3) {
    if (!sample) return []
    const snippets = chunkIntoSnippets(sample)
    const queryTokens = tokenize(instruction)

    const scored = snippets.map((snippet) => ({
        snippet,
        score: overlapScore(tokenize(snippet), queryTokens)
    }))


    const anyMatches = scored.some((s) => s.score > 0)
    const pool = anyMatches ? scored : snippets.map((s) => ({ snippet: s, score: s.length }))

    return pool
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((s) => s.snippet)
}