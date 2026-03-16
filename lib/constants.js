export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

export const RSS_SOURCES = [
  { name: 'Import AI', url: 'https://importai.substack.com/feed', category: 'newsletter' },
  { name: 'The Batch', url: 'https://www.deeplearning.ai/the-batch/feed/', category: 'newsletter' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', category: 'research' },
  { name: "Ben's Bites", url: 'https://bensbites.beehiiv.com/feed', category: 'newsletter' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'news' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'news' },
  { name: 'Stratechery', url: 'https://stratechery.com/feed/', category: 'analysis' },
  { name: 'a16z AI', url: 'https://a16z.com/topic/ai-machine-learning/feed/', category: 'vc' },
  { name: 'One Useful Thing', url: 'https://www.oneusefulthing.org/feed', category: 'research' },
  { name: 'SemiAnalysis', url: 'https://www.semianalysis.com/feed', category: 'deep-dive' },
]

export const DRAFT_PROMPT = `You find AI genuinely fascinating and slightly terrifying. Report what just happened in plain English, then say the quiet part out loud if there is one. Max 280 chars. No hashtags. Return SKIP if the story isn't worth it.`

export const TRENDING_PROMPT = `You find AI genuinely fascinating and slightly terrifying. Report what's actually known about this topic in plain English, then say the quiet part out loud if there is one. Max 280 chars. No hashtags. Return SKIP if it isn't worth it.`

export const SCORING_PROMPT = `Evaluate this tweet. Respond ONLY in valid JSON, no other text:
{ "score": <1-10 integer>, "suggestion": "<one specific improvement under 20 words>", "pattern": "<content type in 3 words>" }`

export const HYPE_PROMPT = `You are a fact-checker for AI industry claims. Given a news headline or topic, assess it on three dimensions:

1. Evidence quality: Is this based on peer-reviewed research, a company press release, a single case study, or speculation?
2. Economic reality: What does this actually mean for costs/jobs/prices if true? What's missing from the narrative?
3. Hype score: 1 (grounded, well-evidenced) to 10 (pure speculation or marketing)

Respond ONLY in valid JSON:
{ "evidence": "<1 sentence>", "economic_reality": "<1 sentence>", "hype_score": <integer 1-10>, "verdict": "GROUNDED" | "MIXED" | "HYPE" }`
