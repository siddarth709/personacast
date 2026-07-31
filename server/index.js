import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const IAM_TOKEN_URL = 'https://iam.cloud.ibm.com/identity/token'
let cachedToken = null
let cachedTokenExpiry = 0

async function getIamToken() {
    if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken    

    const res = await fetch(IAM_TOKEN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
            grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
            apikey: (process.env.WATSONX_API_KEY || '').trim()
        })
    })
    if (!res.ok) throw new Error('Failed to get IAM token: ' + (await res.text()))
    const data = await res.json()
    cachedToken = data.access_token
    cachedTokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return cachedToken    
}

app.post('/api/granite', async (req, res) => {
    try {
        const token = await getIamToken()
        const watsonxUrl = (process.env.WATSONX_URL || '').trim()
        const endpoint = `${watsonxUrl}/ml/v1/text/chat?version=2024-05-31`
        
        const payload = {
            model_id: req.body.model_id,
            project_id: req.body.project_id,
            messages: req.body.messages || [
                { role: 'user', content: req.body.input }
            ],
            max_tokens: req.body.parameters?.max_new_tokens || 400,
            temperature: req.body.parameters?.temperature ?? 0.7
        }

        const wxRes = await fetch(endpoint, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })

        const data = await wxRes.json()
        if (!wxRes.ok) return res.status(wxRes.status).json(data)
        
        const textOutput = data?.choices?.[0]?.message?.content || ''
        res.json({
            results: [{ generated_text: textOutput }],
            raw: data
        })
    } catch(err){
        res.status(500).json({ error: err.message })
    }
})

const PORT = process.env.PORT || 8787

app.listen(PORT, () => console.log(`PersonaCast proxy listening on :${PORT}`))
