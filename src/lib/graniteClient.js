const MODEL_ID = import.meta.env.VITE_WATSONX_MODEL_ID || "meta-llama/llama-3-3-70b-instruct"
const PROJECT_ID = import.meta.env.VITE_WATSONX_PROJECT_ID
const PROXY_ENDPOINT = import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:8787/api/granite'

async function callGranite(prompt, { maxNewTokens = 500, temperature = 0.7 } = {}) {
    const res = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model_id: MODEL_ID,
            project_id: PROJECT_ID,
            input: prompt,
            parameters: {
                max_new_tokens: maxNewTokens,
                temperature
            }
        })
    })
    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Granite call failed (${res.status}): ${text}`)
    }
    const data = await res.json()
    return data?.results?.[0]?.generated_text?.trim() ?? ''
}

const VOICE_PROFILE_PROMPT = (samples) => `WRITING SAMPLES:
"""
${samples}
"""

Analyze the writing samples above from this author and extract their distinctive voice profile.
Return ONLY a valid JSON object matching this exact shape, with no preamble or explanation:
{
  "tone_words": ["wry", "tender", "blunt"],
  "sentence_rhythm": "short punchy sentences alternating with lyrical observations",
  "recurring_phrases_or_habits": ["use of em-dashes", "self-deprecating humor"],
  "recurring_themes": ["nostalgia", "urban solitude"],
  "signature_line": "The rain fell like an unread letter."
}`

const GENERATE_IN_VOICE_PROMPT = (voiceProfile, instruction, wordCount, facts) => `You are ghostwriting as this specific author. You must sound EXACTLY like them - not like a helpful AI assistant describing their style, but like the author themselves actually wrote this.

VOICE PROFILE:
${JSON.stringify(voiceProfile, null, 2)}

STRICT RULES:
- Never mention "voice profile," tone words, or describe the style - just BE it.
- Avoid generic AI phrasing entirely: no "delve into," "a testament to," "moreover," "furthermore," "in conclusion," "it is important to note," "in today's fast-paced world," or similar filler.
- Match the sentence rhythm and length described above exactly - if it says short and punchy, do NOT write long balanced paragraphs.
- Do not hedge or write like a balanced article. Write like a person with opinions and a particular way of talking.
- The "recurring_themes" in the voice profile describe topics this author tends to gravitate toward in their OWN writing - they are not a mandate to insert unrelated technical topics into every piece. Only reference them if genuinely relevant to the current REQUEST.
- Write approximately ${wordCount} words - not significantly more or less. End on a complete thought, don't trail off mid-sentence.
${facts ? `- You are given real facts/data below. Use ONLY these - do not invent, guess, or recall any other numbers, dates, specs, or statistics from your own knowledge, since you may be wrong or outdated. If the request needs a fact you weren't given, write around it in general terms rather than making one up.

REAL FACTS/DATA TO USE (verbatim, do not alter numbers):
"""
${facts}
"""` : ''}

REQUEST:
${instruction}`

function extractFirstJson(str) {
    const cleaned = str.replace(/```json/gi, '').replace(/```/g, '')
    const start = cleaned.indexOf('{')
    if (start === -1) return null
    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < cleaned.length; i++) {
        const char = cleaned[i]
        if (escape) {
            escape = false
            continue
        }
        if (char === '\\') {
            escape = true
            continue
        }
        if (char === '"') {
            inString = !inString
            continue
        }
        if (!inString) {
            if (char === '{') depth++
            else if (char === '}') {
                depth--
                if (depth === 0) {
                    return cleaned.slice(start, i + 1)
                }
            }
        }
    }
    return null
}

export async function extractVoiceProfile(samplesText) {
    const raw = await callGranite(VOICE_PROFILE_PROMPT(samplesText), {
        maxNewTokens: 400,
        temperature: 0.3
    })

    const jsonSnippet = extractFirstJson(raw)
    if (jsonSnippet) {
        try {
            const parsed = JSON.parse(jsonSnippet)
            if (parsed && typeof parsed === 'object') {
                return {
                    tone_words: Array.isArray(parsed.tone_words) ? parsed.tone_words : ["reflective", "candid", "expressive"],
                    sentence_rhythm: parsed.sentence_rhythm || "Measured rhythm with natural cadences.",
                    recurring_phrases_or_habits: Array.isArray(parsed.recurring_phrases_or_habits) ? parsed.recurring_phrases_or_habits : ["vivid imagery"],
                    recurring_themes: Array.isArray(parsed.recurring_themes) ? parsed.recurring_themes : ["personal reflection"],
                    signature_line: parsed.signature_line || "Every line holds a story waiting to be told."
                }
            }
        } catch {
        }
    }

    try {
        const match = raw.match(/\{[\s\S]*?\}/)
        if (match) {
            const parsed = JSON.parse(match[0])
            return {
                tone_words: Array.isArray(parsed.tone_words) ? parsed.tone_words : ["reflective", "candid"],
                sentence_rhythm: parsed.sentence_rhythm || "Dynamic and engaging phrasing.",
                recurring_phrases_or_habits: Array.isArray(parsed.recurring_phrases_or_habits) ? parsed.recurring_phrases_or_habits : ["distinctive tone"],
                recurring_themes: Array.isArray(parsed.recurring_themes) ? parsed.recurring_themes : ["daily observations"],
                signature_line: parsed.signature_line || "Words carry the weight of memory."
            }
        }
    } catch {
    }

    throw new Error('Could not parse voice profile from Granite response: ' + raw)
}

export async function generateInVoice(voiceProfile, instruction, wordCount = 150, facts = '') {
    return await callGranite(GENERATE_IN_VOICE_PROMPT(voiceProfile, instruction, wordCount, facts), {
        maxNewTokens: Math.ceil(wordCount * 1.6) + 60,
        temperature: 0.8
    })
}

const REFINE_IN_VOICE_PROMPT = (voiceProfile, roughDraft) => `You are a supportive writing editor. The text below is a rough draft written by a real person - possibly a non-native English speaker, or someone who finds writing mechanically difficult. Your job is to improve clarity, grammar, and flow WITHOUT erasing their voice.

Rules:
- Keep their sentence rhythm, word choices, and personality intact wherever possible.
- Fix only what genuinely confuses meaning or reads as an error - not stylistic choices that are just "not how a native speaker would phrase it," if the meaning is clear and it reflects who they are.
- Do not make it sound like generic corporate/AI writing.
- Do not add content they didn't write.

VOICE PROFILE (for reference on their natural style):
${JSON.stringify(voiceProfile, null, 2)}

ROUGH DRAFT TO REFINE:
"""
${roughDraft}
"""

Return only the refined text, nothing else.`

export async function refineInVoice(voiceProfile, roughDraft) {
    return await callGranite(REFINE_IN_VOICE_PROMPT(voiceProfile, roughDraft), {
        maxNewTokens: 500,
        temperature: 0.5
    })
}

const REVOICE_SNIPPET_PROMPT = (voiceProfile, snippet, surroundingContext) => `You are rewriting ONE specific sentence or phrase so it matches the author's voice profile below. You are given surrounding context only to preserve meaning and flow - do not rewrite the context, only the snippet.

VOICE PROFILE:
${JSON.stringify(voiceProfile, null, 2)}

SURROUNDING CONTEXT (for reference only):
"""
${surroundingContext}
"""

SNIPPET TO REWRITE (rewrite only this, keep it roughly the same length):
"""
${snippet}
"""

Return ONLY the rewritten snippet, nothing else - no quotes, no explanation.`

export async function reVoiceSnippet(voiceProfile, snippet, surroundingContext) {
    return await callGranite(REVOICE_SNIPPET_PROMPT(voiceProfile, snippet, surroundingContext), {
        maxNewTokens: 150,
        temperature: 0.7
    })
}

const BLEND_GENERATE_PROMPT = (weightedProfiles, instruction, wordCount, facts) => {
    const profileDescriptions = weightedProfiles
        .map(({ profile, weight, name }) =>
            `--- Voice "${name}" (weight: ${weight}%) ---\n${JSON.stringify(profile, null, 2)}`
        )
        .join('\n\n')

    return `You are ghostwriting as a BLEND of the voices below. You must sound like an actual person who has genuinely absorbed both influences - not like an AI describing or naming either style. A higher weight means that voice's tone, rhythm, and habits should dominate more strongly in the final result; a lower weight means it should show through more subtly.

VOICES TO BLEND:
${profileDescriptions}

STRICT RULES:
- Never name the voices, mention weights, or describe the blend - just write in the resulting blended voice directly.
- Avoid generic AI phrasing entirely: no "delve into," "a testament to," "moreover," "furthermore," "in conclusion," "it is important to note," "in today's fast-paced world," or similar filler.
- Do not hedge or write like a balanced encyclopedia entry. Write like a specific person with a specific way of talking.
- The "recurring_themes" in the voice profile describe topics this author tends to gravitate toward in their OWN writing - they are not a mandate to insert unrelated technical topics into every piece. Only reference them if genuinely relevant to the current REQUEST.
- Write approximately ${wordCount} words - not significantly more or less. End on a complete thought, don't trail off mid-sentence.
${facts ? `- You are given real facts/data below. Use ONLY these - do not invent, guess, or recall any other numbers, dates, specs, or statistics from your own knowledge, since you may be wrong or outdated. If the request needs a fact you weren't given, write around it in general terms rather than making one up.

REAL FACTS/DATA TO USE (verbatim, do not alter numbers):
"""
${facts}
"""` : ''}

REQUEST:
${instruction}`
}

export async function generateBlendedVoice(weightedProfiles, instruction, wordCount = 150, facts = '') {
    return await callGranite(BLEND_GENERATE_PROMPT(weightedProfiles, instruction, wordCount, facts), {
        maxNewTokens: Math.ceil(wordCount * 1.6) + 60,
        temperature: 0.8
    })
}

const GENERATE_WITH_EXAMPLES_PROMPT = (voiceProfile, exampleSnippets, instruction, wordCount, facts) => `You are a writing collaborator. Write the requested piece so it matches the author's voice profile below. Study the REAL EXAMPLES closely - they are actual sentences this author wrote, and are your best guide to their true rhythm, word choice, and habits. Do not explain what you're doing, just write the requested piece.

VOICE PROFILE:
${JSON.stringify(voiceProfile, null, 2)}

REAL EXAMPLES FROM THIS AUTHOR (for style reference only - do not reuse their content or topic):
${exampleSnippets.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

STRICT RULES:
- Never mention "voice profile," tone words, or describe the style - just BE it.
- Avoid generic AI phrasing entirely: no "delve into," "a testament to," "moreover," "furthermore," "in conclusion," "it is important to note," "in today's fast-paced world," or similar filler.
- The "recurring_themes" in the voice profile describe topics this author tends to gravitate toward in their OWN writing - they are not a mandate to insert unrelated technical topics into every piece. Only reference them if genuinely relevant to the current REQUEST.
- Write approximately ${wordCount} words - not significantly more or less. End on a complete thought, don't trail off mid-sentence.
${facts ? `- You are given real facts/data below. Use ONLY these - do not invent, guess, or recall any other numbers, dates, specs, or statistics from your own knowledge, since you may be wrong or outdated. If the request needs a fact you weren't given, write around it in general terms rather than making one up.

REAL FACTS/DATA TO USE (verbatim, do not alter numbers):
"""
${facts}
"""` : ''}

REQUEST:
${instruction}`

export async function generateInVoiceWithExamples(voiceProfile, exampleSnippets, instruction, wordCount = 150, facts = '') {
    return await callGranite(GENERATE_WITH_EXAMPLES_PROMPT(voiceProfile, exampleSnippets, instruction, wordCount, facts), {
        maxNewTokens: Math.ceil(wordCount * 1.6) + 60,
        temperature: 0.8
    })
}

const DRIFT_CHECK_PROMPT = (voiceProfile, text) => `You are checking whether a piece of writing stays true to the author's known voice profile below, or whether parts of it drift into generic, flat, or off-tone writing.

VOICE PROFILE:
${JSON.stringify(voiceProfile, null, 2)}

TEXT TO CHECK:
"""
${text}
"""

Return ONLY valid JSON, no preamble, in this shape:
{
  "flagged_sentences": [
    { "sentence": "the exact sentence from the text that feels off-voice", "reason": "brief reason, e.g. 'too generic', 'wrong tone', 'doesn't match rhythm'" }
  ]
}
If nothing feels off, return { "flagged_sentences": [] }.`

export async function checkVoiceDrift(voiceProfile, text) {
    const raw = await callGranite(DRIFT_CHECK_PROMPT(voiceProfile, text), {
        maxNewTokens: 300,
        temperature: 0.2
    })
    const jsonSnippet = extractFirstJson(raw)
    if (!jsonSnippet) return { flagged_sentences: [] }
    try {
        const parsed = JSON.parse(jsonSnippet)
        return { flagged_sentences: Array.isArray(parsed.flagged_sentences) ? parsed.flagged_sentences : [] }
    } catch {
        return { flagged_sentences: [] }
    }
}

const REPLY_TO_EMAIL_PROMPT = (voiceProfile, incomingEmail, replyIntent, tone) => `You are ghostwriting an email reply as this specific author. You must sound EXACTLY like them - not like a helpful AI assistant, but like the author themselves actually wrote this reply.

VOICE PROFILE:
${JSON.stringify(voiceProfile, null, 2)}

REQUESTED TONE FOR THIS EMAIL: ${tone}
Adjust formality and directness to match this tone, but the underlying voice (rhythm, word choices, personality) must still come through - this is the author writing in a ${tone.toLowerCase()} register, not a different person.

STRICT RULES:
- Never mention "voice profile" or describe the style - just BE it, adapted appropriately for email.
- Avoid generic AI phrasing entirely: no "delve into," "a testament to," "moreover," "furthermore," "in conclusion," "it is important to note," "I hope this email finds you well," or similar filler.
- Write a complete, ready-to-send email reply, including an appropriate greeting and sign-off.
- Do not invent facts, commitments, dates, or details not present in the incoming email or the reply intent below.

INCOMING EMAIL TO REPLY TO:
"""
${incomingEmail}
"""

WHAT THE REPLY SHOULD SAY (the user's intent/key points):
${replyIntent}`

export async function replyToEmail(voiceProfile, incomingEmail, replyIntent, tone = 'Neutral') {
    return await callGranite(REPLY_TO_EMAIL_PROMPT(voiceProfile, incomingEmail, replyIntent, tone), {
        maxNewTokens: 500,
        temperature: 0.7
    })
}