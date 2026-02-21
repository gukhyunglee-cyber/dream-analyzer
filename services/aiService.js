/**
 * AI Service Factory
 * Provides a unified interface for multiple LLM providers
 */

const OpenAI = require('openai');

class AIService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'openai';
        this.initializeProvider();
    }

    initializeProvider() {
        switch (this.provider) {
            case 'openai':
                this.client = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
                this.model = process.env.OPENAI_MODEL || 'gpt-4';
                break;

            case 'claude':
                // Future implementation
                throw new Error('Claude provider not yet implemented. Coming soon!');

            case 'gemini':
                // Future implementation
                throw new Error('Gemini provider not yet implemented. Coming soon!');

            default:
                throw new Error(`Unknown AI provider: ${this.provider}`);
        }
    }

    /**
     * Analyze dream using the configured LLM provider
     */
    async analyzeDream(dreamContent, userInfo) {
        switch (this.provider) {
            case 'openai':
                return await this.analyzeWithOpenAI(dreamContent, userInfo);
            case 'claude':
                return await this.analyzeWithClaude(dreamContent, userInfo);
            case 'gemini':
                return await this.analyzeWithGemini(dreamContent, userInfo);
            default:
                throw new Error(`Provider ${this.provider} not supported`);
        }
    }

    /**
     * OpenAI-specific implementation
     */
    async analyzeWithOpenAI(dreamContent, userInfo) {
        const prompt = this.buildJungianPrompt(dreamContent, userInfo);

        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are a warm, insightful psychological counselor with deep knowledge of Jungian analytical psychology.
Your task is to provide a profound yet VERY EASY TO UNDERSTAND analysis of the user's dream based on Carl Jung's concepts.

Key Analysis Requirements (Translate concepts into everyday language):
1. **Unconscious & Archetypes**: Explain the deeper unconscious meaning using friendly terms. Instead of harsh terms like "Archetypes (Shadow, Anima)", use phrases like "내면의 상징적 인물 (그림자, 진정한 나 등)". 
2. **Symbolism**: Interpret symbols by connecting them to the dreamer's daily life, emotions, and psychological state, using relatable analogies.
3. **Individuation**: Instead of "Individuation", talk about "자아 성장과 진정한 내 모습을 찾아가는 과정" (The process of personal growth and finding one's true self).
4. **Emotional Tone**: Analyze the emotions felt in the dream and offer warm, counseling-style comfort.
5. **Continuous Analysis**: If past dreams are provided, connect the current dream to them. Identify recurring themes or show how the psychological state has evolved over time.

Tone:
- Warm, empathetic, encouraging, and easy to read (like a friendly counseling session).
- Avoid overly academic, mystical, or difficult psychological jargon. Use middle-school level Korean.
- Go deep into the meaning, but explain it simply.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code blocks. Use this exact structure:
{
  "overall_interpretation": "A detailed, comforting, and easy-to-understand synthesis of the dream's meaning. Minimum 300 characters.",
  "archetypes": ["List of core characters/symbols found. Format: '상징 이름: 꿈에서 이 상징이 어떤 의미인지 쉬운 설명'"],
  "symbols": {"상징 이름": "이 상징이 나타내는 쉽고 공감가는 의미"},
  "psychological_state": "Assessment of the dreamer's current internal state in friendly terms.",
  "individuation_insights": "Warm guidance on how this dream helps their personal growth and finding their true self.",
  "recommendations": "Concrete, actionable, and gentle advice for reflection or daily life (e.g., journaling, small actions)."
}

Language: Korean (Natural, warm, comforting and VERY EASY Korean).`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8, // Increased for more creative/insightful analysis
                max_tokens: 2000 // Ensure enough space for detailed response
            });

            let analysisText = completion.choices[0].message.content.trim();

            // Remove markdown code blocks if present
            analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            let analysis;
            try {
                analysis = JSON.parse(analysisText);
            } catch (parseError) {
                // If JSON parsing fails, create a basic structure with the raw text
                console.error('JSON parsing error, using fallback:', parseError);
                analysis = {
                    overall_interpretation: analysisText,
                    archetypes: [],
                    symbols: {},
                    psychological_state: "분석 결과를 구조화하지 못했습니다.",
                    individuation_insights: "현재 이 꿈에 대한 추가적인 내면 성장 조언을 불러올 수 없습니다.",
                    recommendations: "특별한 성찰 제안이 해석되지 않았습니다."
                };
            }

            return {
                success: true,
                analysis: analysis,
                rawText: analysisText
            };
        } catch (error) {
            console.error('OpenAI analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Claude-specific implementation (placeholder)
     */
    async analyzeWithClaude(dreamContent, userInfo) {
        // TODO: Implement Claude API integration
        throw new Error('Claude integration coming soon');
    }

    /**
     * Gemini-specific implementation (placeholder)
     */
    async analyzeWithGemini(dreamContent, userInfo) {
        // TODO: Implement Gemini API integration
        throw new Error('Gemini integration coming soon');
    }

    /**
     * Build Jungian analysis prompt
     */
    buildJungianPrompt(dreamContent, userInfo) {
        const { birth_date, gender, past_dreams } = userInfo;

        let prompt = `Please analyze the following dream from a Jungian perspective:\n\n`;
        prompt += `Dream Content:\n${dreamContent}\n\n`;

        if (birth_date) {
            prompt += `Dreamer's Birth Date: ${birth_date}\n`;
        }
        if (gender) {
            prompt += `Gender: ${gender}\n`;
        }

        if (past_dreams && past_dreams.length > 0) {
            prompt += `\n--- Past Dreams of the User ---\n`;
            past_dreams.forEach((pd, index) => {
                prompt += `Dream ${index + 1} (${pd.date}):\nTitle: ${pd.title}\nContent: ${pd.content}\n\n`;
            });
            prompt += `Please analyze the NEW dream not just in isolation, but on a continuum with these past dreams. Discuss any recurring symbols, themes, or the progression of the user's individuation process and psychological growth based on Jung's theory.\n`;
        }

        prompt += `\nProvide a warm, easy-to-understand psychological analysis focusing on inner symbols, emotions, and the journey to finding one's true self.`;

        return prompt;
    }
}

// Singleton instance
let aiServiceInstance = null;

function getAIService() {
    if (!aiServiceInstance) {
        aiServiceInstance = new AIService();
    }
    return aiServiceInstance;
}

module.exports = { getAIService };
