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
                        content: `You are an expert, world-class Jungian analyst with decades of experience in depth psychology.
Your task is to provide a profound, detailed, and comprehensive analysis of the user's dream based on Carl Jung's analytical psychology.

Key Analysis Requirements:
1. **Unconscious & Archetypes**: deeply explore the Collective Unconscious. Identify archetypes (Shadow, Anima/Animus, Self, Persona, Great Mother, Wise Old Man, etc.) and explain WHY they appear.
2. **Symbolism**: Interpret symbols not just superficially, but by connecting them to myths, cultural context, and the dreamer's potential psychological state.
3. **Individuation**: Explain how this dream relates to the dreamer's path of individuation (becoming their true self).
4. **Emotional Tone**: Analyze the emotions felt in the dream and their significance.

Tone:
- Professional, empathetic, insightful, and mystical yet grounded.
- Use rich, descriptive language.
- Avod generic or short responses. GO DEEP.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code blocks. Use this exact structure:
{
  "overall_interpretation": "A detailed, multi-paragraph synthesis of the dream's meaning, dealing with the major themes and narrative arc. Minimum 300 characters.",
  "archetypes": ["Detailed list of archetypes. Format: 'Archetype Name: Explanation of its role in this specific dream'"],
  "symbols": {"Symbol Name": "Deep interpretation of this symbol"},
  "psychological_state": "Assessment of the dreamer's current internal state (e.g., conflict, transition, integration).",
  "individuation_insights": "Specific guidance on how this dream aids personal growth.",
  "recommendations": "Concrete, actionable advice for reflection (e.g., journaling topics, active imagination exercises)."
}

Language: Korean (Natural, professional, and expressive Korean).`
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
                    individuation_insights: "",
                    recommendations: ""
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
        const { birth_date, gender } = userInfo;

        let prompt = `Please analyze the following dream from a Jungian perspective:\n\n`;
        prompt += `Dream Content:\n${dreamContent}\n\n`;

        if (birth_date) {
            prompt += `Dreamer's Birth Date: ${birth_date}\n`;
        }
        if (gender) {
            prompt += `Gender: ${gender}\n`;
        }

        prompt += `\nProvide a comprehensive Jungian analysis focusing on archetypes, symbols, and the individuation process.`;

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
