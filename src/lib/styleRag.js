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

function isRawCodeLine(text) {
    const codePattern = /^(import\s+|from\s+\w+\s+import|def\s+\w+|class\s+\w+|try:|except\s+|if\s+__name__|span\.|tracer\.|#\s*\w+\.py)/i
    const codeSymbols = (text.match(/[{}[\]();=><]/g) || []).length
    return codePattern.test(text.trim()) || codeSymbols > 5
}

function cleanProseSnippet(text) {
    return text
        .replace(/#\s*[^\n]*/g, '')
        .replace(/tracer\.[a-z0-9_()."']+/gi, '')
        .replace(/span\.[a-z0-9_()."']+/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function chunkIntoSnippets(sample) {
    const paragraphs = sample.split(/\n\s*\n/)
    const snippets = []

    for (const para of paragraphs) {
        const sentences = para.split(/(?<=[.!?])\s+/)
        let currentChunk = ''

        for (const s of sentences) {
            const trimmed = s.trim()
            if (!trimmed || isRawCodeLine(trimmed)) continue
            
            const cleaned = cleanProseSnippet(trimmed)
            if (cleaned.length < 15) continue

            if ((currentChunk + ' ' + cleaned).length > 280) {
                if (currentChunk.length > 30) snippets.push(currentChunk.trim())
                currentChunk = cleaned
            } else {
                currentChunk = currentChunk ? `${currentChunk} ${cleaned}` : cleaned
            }
        }

        if (currentChunk.length > 30) {
            snippets.push(currentChunk.trim())
        }
    }

    if (snippets.length > 0) return snippets

    // Fallback if sample was pure code
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
    if (!sample || !instruction) return []
    const snippets = chunkIntoSnippets(sample)
    const queryTokens = tokenize(instruction)

    const scored = snippets.map((snippet) => ({
        snippet,
        score: overlapScore(tokenize(snippet), queryTokens)
    }))

    const matches = scored.filter((s) => s.score > 0)
    if (matches.length === 0) return []

    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((s) => s.snippet)
}