import { useState, useEffect } from 'react'
import SampleIntake from './components/SampleIntake'
import VoiceFingerprint from './components/VoiceFingerprint'
import GenerationPanel from './components/GenerationPanel'
import ProfileManager from './components/ProfileManager'
import PersonaBlender from './components/PersonaBlender'
import { extractVoiceProfile, generateInVoice, generateInVoiceWithExamples } from './lib/graniteClient'
import { loadProfiles } from './lib/profileStore'
import './styles/app.css'
import DriftEditor from './components/DriftEditor'
import EmailReplier from './components/EmailReplier'

export default function App() {
    const [profile, setProfile] = useState(null)
    const [activeSample, setActiveSample] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [activeMode, setActiveMode] = useState('write')
    const [savedProfiles, setSavedProfiles] = useState([])
    const [showAnalyzer, setShowAnalyzer] = useState(false)

    useEffect(() => {
        const loaded = loadProfiles()
        setSavedProfiles(loaded)
        if (loaded.length > 0) {
            setProfile(loaded[0].profile)
            setActiveSample(loaded[0].sourceSample)
        }
    }, [])

    async function handleAnalyze(samples) {
        setIsAnalyzing(true)
        setError(null)
        try {
            const extracted = await extractVoiceProfile(samples)
            setProfile(extracted)
            setActiveSample(samples)
            setShowAnalyzer(false)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsAnalyzing(false)
        }
    }

    async function handleGenerate(instruction, snippets = [], wordCount = 150, facts = '') {
        setIsGenerating(true)
        setError(null)
        try {
            const text = snippets.length > 0
                ? await generateInVoiceWithExamples(profile, snippets, instruction, wordCount, facts)
                : await generateInVoice(profile, instruction, wordCount, facts)
            setResult(text)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    function handleSelectSavedProfile(saved) {
        setProfile(saved.profile)
        setActiveSample(saved.sourceSample)
        setResult(null)
        setShowAnalyzer(false)
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <span className="wordmark">PersonaCast</span>
                <span className="tagline">write like you, not like a model</span>
            </header>

            <main>
                <ProfileManager
                    activeProfile={profile}
                    activeSample={activeSample}
                    onSelectProfile={handleSelectSavedProfile}
                    profiles={savedProfiles}
                    setProfiles={setSavedProfiles}
                />

                <PersonaBlender savedProfiles={savedProfiles} />

                {/* Voice Analyzer & Intake */}
                <div className="analyzer-section">
                    {!profile || showAnalyzer ? (
                        <div className="analyzer-card-wrapper">
                            {profile && (
                                <button className="text-btn close-analyzer-btn" onClick={() => setShowAnalyzer(false)}>
                                    ✕ Close Analyzer
                                </button>
                            )}
                            <SampleIntake onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                        </div>
                    ) : (
                        <div className="analyzer-toggle-bar">
                            <button className="secondary-btn analyze-toggle-btn" onClick={() => setShowAnalyzer(true)}>
                                🔬 Analyze New Writing Sample / Build Voice Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Voice Fingerprint Display */}
                {profile && (
                    <VoiceFingerprint profile={profile} />
                )}

                {/* Mode Tabs & Generation Suite */}
                {profile && (
                    <>
                        <div className="mode-tab-bar">
                            <button
                                className={`mode-tab ${activeMode === 'write' ? 'active' : ''}`}
                                onClick={() => setActiveMode('write')}
                            >
                                ✍️ General Writing
                            </button>
                            <button
                                className={`mode-tab ${activeMode === 'email' ? 'active' : ''}`}
                                onClick={() => setActiveMode('email')}
                            >
                                ✉️ Email Reply Generator
                            </button>
                            <button
                                className={`mode-tab ${activeMode === 'drift' ? 'active' : ''}`}
                                onClick={() => setActiveMode('drift')}
                            >
                                🔍 Voice Drift Detector
                            </button>
                        </div>

                        {activeMode === 'write' && (
                            <GenerationPanel
                                onGenerate={handleGenerate}
                                isGenerating={isGenerating}
                                result={result}
                                voiceProfile={profile}
                                onResultChange={setResult}
                                activeSample={activeSample}
                            />
                        )}
                        {activeMode === 'email' && (
                            <EmailReplier voiceProfile={profile} />
                        )}
                        {activeMode === 'drift' && (
                            <DriftEditor voiceProfile={profile} />
                        )}
                    </>
                )}

                {error && <p className="error">{error}</p>}
            </main>

            <footer className="app-footer">
                <span>Built with IBM Bob · powered by IBM Granite (watsonx.ai)</span>
            </footer>
        </div>
    )
}
