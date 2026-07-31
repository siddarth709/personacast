const GENERIC_AI_PHRASES = [
    'as an ai language model',
    'i cannot provide',
    'in today\'s fast-paced world',
    'in the world of',
    'delve into',
    'dive into',
    'unleash the power',
    'unlock the potential',
    'it is important to note',
    "it's important to note",
    'moreover,',
    'furthermore,',
    'in conclusion,',
    'a testament to',
    'plays a crucial role',
    'plays a vital role',
    'navigate the complexities',
    'in the ever-evolving',
    'seamlessly integrate',
    'game-changer',
    'at the end of the day',
    'when it comes to',
    'the importance of'
]


export function findGenericPhrases(text) {
    const lower = text.toLowerCase()
    const hits = []
    for (const phrase of GENERIC_AI_PHRASES) {
        let fromIndex = 0
        let idx
        while ((idx = lower.indexOf(phrase, fromIndex)) !== -1) {
            hits.push({ phrase: text.slice(idx, idx + phrase.length), index: idx })
            fromIndex = idx + phrase.length
        }
    }
    return hits.sort((a, b) => a.index - b.index)
}