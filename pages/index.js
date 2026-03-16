import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { callClaude, parseJSON, storage } from '../lib/api'
import {
  DRAFT_PROMPT,
  TRENDING_PROMPT,
  SCORING_PROMPT,
  HYPE_PROMPT,
  RSS_SOURCES,
} from '../lib/constants'

const SAMPLE_ARTICLES = [
  { title: 'Klarna replaces 700 customer service agents with AI', summary: "Klarna's AI assistant handles 2.3M conversations — equivalent workload of 700 full-time agents with comparable satisfaction scores.", source: 'TechCrunch' },
  { title: 'AI coding agents reduce software dev costs by 40% at mid-size firms', summary: 'Study of 200 companies shows AI coding assistants cut development budgets 40% while maintaining output quality.', source: 'VentureBeat' },
  { title: 'Legal AI agents handle routine contract review at 1% of traditional cost', summary: 'Contract review AI from Harvey and Ironclad enables small businesses to access legal review for under $10 vs $500–2000.', source: 'Import AI' },
  { title: 'AI agents drive 60% reduction in call center headcount across Fortune 500', summary: 'Fortune 500 firms report major workforce reductions as multi-modal AI handles complex support without human escalation.', source: 'The Batch' },
  { title: 'Anthropic Claude agents complete 90% of data analysis tasks autonomously', summary: 'Enterprise customers report Claude-based pipelines completing complex analysis that previously required senior analysts.', source: 'Hugging Face' },
  { title: 'Real estate AI cuts property valuation time from weeks to minutes', summary: 'AI-powered appraisal tools compress valuation timelines and threaten traditional appraisal fee structures.', source: 'VentureBeat' },
  { title: 'AI agents in healthcare scheduling reduce admin costs by 35%', summary: 'Hospital networks report significant reduction in scheduling and prior authorization costs after deploying AI agents.', source: 'The Batch' },
  { title: 'Autonomous AI agents now handle 80% of tier-1 IT support tickets', summary: 'Enterprise IT departments report AI agents resolving the majority of routine support requests without human intervention, cutting per-ticket costs from $22 to $3.', source: 'Import AI' },
]

const TRENDING_TOPICS = [
  'OpenAI GPT-5 agent capabilities',
  'AI replacing white collar jobs 2025',
  'Autonomous AI agents in enterprise',
  'Cost of AI inference dropping 90%',
  'AI agents in legal industry',
  'Claude computer use agents',
  'AI impact on software developer salaries',
  'Agentic AI supply chain automation',
]

const s = () => storage()

function Tag({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--bg-hover)', color: 'var(--text-muted)' },
    green: { bg: 'var(--green-bg)', color: 'var(--green)' },
    amber: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    red: { bg: 'var(--red-bg)', color: 'var(--red)' },
    blue: { bg: 'var(--blue-bg)', color: 'var(--blue)' },
  }
  const c = colors[color] || colors.default
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', ...style }}>
      {children}
    </div>
  )
}

function Notify({ notification }) {
  if (!notification) return null
  const c = notification.type === 'error' ? 'var(--red)' : notification.type === 'amber' ? 'var(--amber)' : 'var(--green)'
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '10px 18px', borderRadius: 'var(--radius)', border: `1px solid ${c}`, background: 'var(--bg-card)', color: c, fontSize: 12, letterSpacing: '0.02em' }}>
      {notification.msg}
    </div>
  )
}

function EmptyState({ message, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{message}</p>
      {sub && <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('drafts')
  const [drafts, setDrafts] = useState([])
  const [published, setPublished] = useState([])
  const [insights, setInsights] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [analyzingId, setAnalyzingId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [trendingTopics, setTrendingTopics] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [checkingHype, setCheckingHype] = useState(null)
  const [hypeResults, setHypeResults] = useState({})
  const [customTopic, setCustomTopic] = useState('')

  useEffect(() => {
    const store = s()
    const d = store.get('drafts')
    const p = store.get('published')
    const i = store.get('insights')
    const k = store.get('apiKey')
    const t = store.get('trendingTopics')
    const h = store.get('hypeResults')
    if (d) setDrafts(d)
    if (p) setPublished(p)
    if (i) setInsights(i)
    if (k) { setApiKey(k); setApiKeyInput(k) }
    if (t) setTrendingTopics(t)
    if (h) setHypeResults(h)
  }, [])

  const persist = useCallback((key, val) => s().set(key, val), [])

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const requireKey = () => {
    if (!apiKey) { setShowKeyModal(true); return false }
    return true
  }

  const saveKey = () => {
    setApiKey(apiKeyInput)
    persist('apiKey', apiKeyInput)
    setShowKeyModal(false)
    notify('API key saved')
  }

  // Generate drafts from sample articles
  const generateDrafts = async () => {
    if (!requireKey()) return
    setGenerating(true)
    setTab('drafts')
    const articles = [...SAMPLE_ARTICLES].sort(() => Math.random() - 0.5).slice(0, 3)
    const newDrafts = []
    for (const a of articles) {
      try {
        const articleText = await fetchArticle(a.url)
        const context = articleText
          ? `Full article:\n${articleText}`
          : `Summary: ${a.summary}`

        const text = await callClaude(
          apiKey,
          DRAFT_PROMPT,
          `Article: "${a.title}"\n\n${context}\n\nWrite one tweet (max 280 chars). Output only the tweet text, nothing else. If not worth tweeting, output SKIP.`
        )
        if (text && text !== 'SKIP') {
          newDrafts.push({
            id: Date.now() + Math.random(),
            text,
            source: a.source,
            sourceTitle: a.title,
            createdAt: new Date().toISOString(),
            type: 'article',
          })
        }
      } catch (e) { notify('Generation failed — check API key', 'error'); break }
    }
    const updated = [...newDrafts, ...drafts]
    setDrafts(updated)
    persist('drafts', updated)
    setGenerating(false)
    if (newDrafts.length) notify(`${newDrafts.length} drafts ready`)
  }

  // Load trending topics (uses curated list + Claude to expand)
  const loadTrending = async () => {
    if (!requireKey()) return
    setLoadingTrending(true)
    setTab('trending')
    try {
      const raw = await callClaude(
        apiKey,
        'You are an AI industry analyst. List 8 specific, currently relevant topics about AI agents and economic impact. Focus on concrete developments, not vague themes. Respond ONLY with a JSON array of strings: ["topic1", "topic2", ...]',
        'What are the most significant AI agent topics worth covering right now from an economic impact perspective? Be specific — name companies, industries, or data points.',
        500
      )
      const parsed = parseJSON(raw)
      const topics = Array.isArray(parsed) ? parsed : TRENDING_TOPICS
      setTrendingTopics(topics)
      persist('trendingTopics', topics)
    } catch {
      setTrendingTopics(TRENDING_TOPICS)
      persist('trendingTopics', TRENDING_TOPICS)
    }
    setLoadingTrending(false)
  }

  // Check hype score for a topic
  const checkHype = async (topic) => {
    if (!requireKey()) return
    setCheckingHype(topic)
    try {
      const raw = await callClaude(apiKey, HYPE_PROMPT, `Topic: "${topic}"`, 400)
      const parsed = parseJSON(raw)
      if (parsed) {
        const updated = { ...hypeResults, [topic]: parsed }
        setHypeResults(updated)
        persist('hypeResults', updated)
      }
    } catch { notify('Hype check failed', 'error') }
    setCheckingHype(null)
  }

  // Draft a tweet about a trending topic
  const draftFromTrending = async (topic) => {
    if (!requireKey()) return
    setCheckingHype(topic + '_drafting')
    try {
      const hype = hypeResults[topic]
      const context = hype ? `Evidence quality: ${hype.evidence}\nEconomic reality: ${hype.economic_reality}` : ''
      const text = await callClaude(
        apiKey,
        TRENDING_PROMPT,
        `Topic: "${topic}"\n${context}\n\nWrite a factual breakdown tweet (max 280 chars). Output only the tweet text.`
      )
      if (text) {
        const newDraft = {
          id: Date.now() + Math.random(),
          text,
          source: 'Trending',
          sourceTitle: topic,
          createdAt: new Date().toISOString(),
          type: 'trending',
        }
        const updated = [newDraft, ...drafts]
        setDrafts(updated)
        persist('drafts', updated)
        notify('Draft added — check Drafts tab')
      }
    } catch { notify('Draft failed', 'error') }
    setCheckingHype(null)
  }

  // Add custom topic
  const addCustomTopic = () => {
    if (!customTopic.trim()) return
    const updated = [customTopic.trim(), ...trendingTopics]
    setTrendingTopics(updated)
    persist('trendingTopics', updated)
    setCustomTopic('')
    notify('Topic added')
  }

  const approve = (draft) => {
    const newDrafts = drafts.filter(d => d.id !== draft.id)
    const newPub = [{ ...draft, status: 'published', publishedAt: new Date().toISOString(), likes: 0, reposts: 0, impressions: 0 }, ...published]
    setDrafts(newDrafts); setPublished(newPub)
    persist('drafts', newDrafts); persist('published', newPub)
    notify('Approved — copy to X and post')
  }

  const discard = (id) => {
    const updated = drafts.filter(d => d.id !== id)
    setDrafts(updated); persist('drafts', updated)
    notify('Discarded', 'amber')
  }

  const saveEdit = (id) => {
    const updated = drafts.map(d => d.id === id ? { ...d, text: editText } : d)
    setDrafts(updated); persist('drafts', updated)
    setEditingId(null); notify('Saved')
  }

  const updateMetric = (id, field, val) => {
    const updated = published.map(p => p.id === id ? { ...p, [field]: parseInt(val) || 0 } : p)
    setPublished(updated); persist('published', updated)
  }

  const analyze = async (post) => {
    if (!requireKey()) return
    setAnalyzingId(post.id)
    try {
      const raw = await callClaude(
        apiKey,
        SCORING_PROMPT,
        `Tweet: "${post.text}"\nMetrics: ${post.likes} likes, ${post.reposts} reposts, ${post.impressions} impressions`,
        300
      )
      const parsed = parseJSON(raw)
      if (parsed) {
        const newInsight = { id: Date.now(), postId: post.id, preview: post.text.slice(0, 60) + '...', ...parsed, createdAt: new Date().toISOString() }
        const updated = [newInsight, ...insights].slice(0, 50)
        setInsights(updated); persist('insights', updated)
        notify('Analysis complete')
      }
    } catch { notify('Analysis failed', 'error') }
    setAnalyzingId(null)
  }

  const verdictColor = (v) => v === 'GROUNDED' ? 'green' : v === 'MIXED' ? 'amber' : 'red'
  const hypeColor = (n) => n <= 3 ? 'green' : n <= 6 ? 'amber' : 'red'
  const charColor = (n) => n > 260 ? 'var(--red)' : n > 230 ? 'var(--amber)' : 'var(--text-dim)'
  const scoreColor = (n) => n >= 7 ? 'var(--green)' : n >= 5 ? 'var(--amber)' : 'var(--red)'

  const tabs = [
    { id: 'drafts', label: 'drafts', count: drafts.length },
    { id: 'trending', label: 'trending' },
    { id: 'published', label: 'published', count: published.length },
    { id: 'insights', label: 'insights', count: insights.length },
    { id: 'setup', label: 'setup' },
  ]

  return (
    <>
      <Head>
        <title>AI X Agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Notify notification={notification} />

      {showKeyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowKeyModal(false)}>
          <Card style={{ width: 360 }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 500, marginBottom: 6 }}>Claude API key</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>Get one at console.anthropic.com — costs ~$2–5/month at this volume.</p>
            <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="sk-ant-..." onKeyDown={e => e.key === 'Enter' && saveKey()} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="primary" onClick={saveKey}>Save key</button>
              <button onClick={() => setShowKeyModal(false)}>Cancel</button>
            </div>
          </Card>
        </div>
      )}

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 3 }}>AI X agent</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, letterSpacing: '0.02em' }}>ECONOMIC INTELLIGENCE · AI COST IMPACT</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadTrending} disabled={loadingTrending}>{loadingTrending ? 'loading...' : 'refresh trending'}</button>
            <button className="primary" onClick={generateDrafts} disabled={generating}>{generating ? 'generating...' : 'generate drafts'}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '1px solid var(--text)' : '1px solid transparent', borderRadius: 0, padding: '8px 16px', fontSize: 12, color: tab === t.id ? 'var(--text)' : 'var(--text-dim)', letterSpacing: '0.04em', marginBottom: -1 }}>
              {t.label}{t.count !== undefined ? ` [${t.count}]` : ''}
            </button>
          ))}
        </div>

        {/* DRAFTS */}
        {tab === 'drafts' && (
          <div>
            {drafts.length === 0
              ? <EmptyState message="No drafts yet." sub='Hit "generate drafts" or create one from the Trending tab.' />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {drafts.map(d => (
                    <Card key={d.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tag color={d.type === 'trending' ? 'blue' : 'default'}>{d.source}</Tag>
                          {d.type === 'trending' && <Tag color="blue">trending</Tag>}
                        </div>
                        <span style={{ fontSize: 11, color: charColor(d.text.length) }}>{d.text.length}/280</span>
                      </div>
                      {editingId === d.id
                        ? <div>
                            <textarea value={editText} onChange={e => setEditText(e.target.value)} style={{ minHeight: 80, lineHeight: 1.6, marginBottom: 10, resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="primary" onClick={() => saveEdit(d.id)}>save</button>
                              <button onClick={() => setEditingId(null)}>cancel</button>
                            </div>
                          </div>
                        : <div>
                            <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 8, color: 'var(--text)' }}>{d.text}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, fontStyle: 'italic' }}>{d.sourceTitle?.slice(0, 80)}{d.sourceTitle?.length > 80 ? '...' : ''}</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="primary" style={{ color: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => approve(d)}>approve</button>
                              <button onClick={() => { setEditingId(d.id); setEditText(d.text) }}>edit</button>
                              <button style={{ color: 'var(--text-dim)' }} onClick={() => discard(d.id)}>discard</button>
                            </div>
                          </div>
                      }
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* TRENDING */}
        {tab === 'trending' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Add your own topic..." onKeyDown={e => e.key === 'Enter' && addCustomTopic()} style={{ flex: 1 }} />
              <button className="primary" onClick={addCustomTopic}>add</button>
            </div>
            {trendingTopics.length === 0
              ? <EmptyState message="No topics loaded." sub='Hit "refresh trending" to load AI topics, or add your own above.' />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trendingTopics.map((topic, i) => {
                    const hype = hypeResults[topic]
                    const isDrafting = checkingHype === topic + '_drafting'
                    const isChecking = checkingHype === topic
                    return (
                      <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <p style={{ fontSize: 14, lineHeight: 1.5, flex: 1, color: 'var(--text)' }}>{topic}</p>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {!hype && <button onClick={() => checkHype(topic)} disabled={!!checkingHype}>{isChecking ? 'checking...' : 'fact check'}</button>}
                            <button className="primary" onClick={() => draftFromTrending(topic)} disabled={!!checkingHype}>{isDrafting ? 'drafting...' : 'draft tweet'}</button>
                          </div>
                        </div>
                        {hype && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                              <Tag color={verdictColor(hype.verdict)}>{hype.verdict}</Tag>
                              <Tag color={hypeColor(hype.hype_score)}>hype: {hype.hype_score}/10</Tag>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}><span style={{ color: 'var(--text-dim)' }}>evidence — </span>{hype.evidence}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}><span style={{ color: 'var(--text-dim)' }}>economic reality — </span>{hype.economic_reality}</p>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
            }
          </div>
        )}

        {/* PUBLISHED */}
        {tab === 'published' && (
          <div>
            {published.length === 0
              ? <EmptyState message="No published posts yet." sub="Approve drafts, post to X manually, then track metrics here." />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {published.map(p => (
                    <Card key={p.id}>
                      <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 14, color: 'var(--text)' }}>{p.text}</p>
                      <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
                        {['likes', 'reposts', 'impressions'].map(f => (
                          <div key={f}>
                            <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', letterSpacing: '0.06em', marginBottom: 4 }}>{f.toUpperCase()}</label>
                            <input type="number" min="0" defaultValue={p[f]} onBlur={e => updateMetric(p.id, f, e.target.value)} style={{ width: 80, fontSize: 13 }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <button onClick={() => analyze(p)} disabled={analyzingId === p.id}>{analyzingId === p.id ? 'analyzing...' : 'analyze'}</button>
                      </div>
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* INSIGHTS */}
        {tab === 'insights' && (
          <div>
            {insights.length === 0
              ? <EmptyState message="No insights yet." sub="Post to X, log metrics in Published, then hit Analyze to start building style intelligence." />
              : <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: '1.5rem' }}>
                    {[
                      { label: 'AVG SCORE', value: (insights.reduce((a, i) => a + i.score, 0) / insights.length).toFixed(1) },
                      { label: 'ANALYZED', value: insights.length },
                      { label: 'TOP PATTERN', value: insights[0]?.pattern || '—' },
                    ].map(m => (
                      <div key={m.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 6 }}>{m.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 500 }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insights.map(ins => (
                      <Card key={ins.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>"{ins.preview}"</p>
                          <span style={{ fontSize: 20, fontWeight: 500, color: scoreColor(ins.score), minWidth: 44, textAlign: 'right' }}>{ins.score}/10</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>{ins.suggestion}</p>
                        <Tag color="blue">{ins.pattern}</Tag>
                      </Card>
                    ))}
                  </div>
                </div>
            }
          </div>
        )}

        {/* SETUP */}
        {tab === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card>
              <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>01 — Claude API key</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>Get one at console.anthropic.com — ~$2–5/month at this volume.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="sk-ant-..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && saveKey()} />
                <button className="primary" onClick={saveKey}>save</button>
              </div>
              {apiKey && <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 8 }}>key saved</p>}
            </Card>

            <Card>
              <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>02 — Daily workflow</p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                <p>1. Hit <span style={{ color: 'var(--text)' }}>generate drafts</span> — pulls from AI news sources, writes 3 economic takes</p>
                <p>2. Or go to <span style={{ color: 'var(--text)' }}>trending</span> → fact check a topic → draft a tweet from the evidence</p>
                <p>3. Review drafts, edit if needed, approve the good ones</p>
                <p>4. Copy approved tweets to X and post manually</p>
                <p>5. Come back, enter likes/reposts/impressions, hit Analyze</p>
                <p>6. Check Insights over time to see what writing patterns work</p>
              </div>
            </Card>

            <Card>
              <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>03 — Automate with n8n (when ready)</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>Do 2–3 weeks manually first. When you trust the output, download this and import into n8n to run fully autonomous.</p>
              <button className="primary" onClick={() => {
                const wf = {
                  name: 'AI X Agent — RSS to X Pipeline',
                  nodes: [
                    { name: 'Every 6 hours', type: 'n8n-nodes-base.scheduleTrigger', parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 6 }] } } },
                    { name: 'RSS Sources', type: 'n8n-nodes-base.rssFeedRead', note: 'Duplicate for each source', parameters: { url: 'https://importai.substack.com/feed' } },
                    { name: 'Claude: Score + Draft', type: 'n8n-nodes-base.httpRequest', parameters: { method: 'POST', url: 'https://api.anthropic.com/v1/messages', headers: { 'x-api-key': '={{ $env.ANTHROPIC_API_KEY }}', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: DRAFT_PROMPT, messages: [{ role: 'user', content: '={{ \'Rate this 1-10 for AI economic relevance, then if >= 7 write a tweet. JSON only: {"score": N, "tweet": "..."}\n\nTitle: \' + $json.title + \'\nSummary: \' + $json.contentSnippet }}' }] }) } },
                    { name: 'Score >= 7?', type: 'n8n-nodes-base.if', parameters: { conditions: { number: [{ value1: '={{ JSON.parse($json.content[0].text).score }}', operation: 'largerEqual', value2: 7 }] } } },
                    { name: 'Post to X', type: 'n8n-nodes-base.twitter', parameters: { text: "={{ JSON.parse($node['Claude: Score + Draft'].json.content[0].text).tweet }}" } },
                  ],
                  connections: { 'Every 6 hours': { main: [['RSS Sources']] }, 'RSS Sources': { main: [['Claude: Score + Draft']] }, 'Claude: Score + Draft': { main: [['Score >= 7?']] }, 'Score >= 7?': { main: [['Post to X'], []] } },
                }
                const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' })
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai-x-agent-n8n.json'; a.click()
              }}>download n8n workflow</button>
            </Card>

            <Card>
              <p style={{ fontWeight: 500, marginBottom: 12, fontSize: 13 }}>04 — RSS sources</p>
              <div>
                {RSS_SOURCES.map((src, i) => (
                  <div key={src.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < RSS_SOURCES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <span style={{ fontSize: 13 }}>{src.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 10 }}>{src.url}</span>
                    </div>
                    <Tag>{src.category}</Tag>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
