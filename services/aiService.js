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
                        content: `You are an expert in Jungian dream analysis. You analyze dreams through the lens of Carl Jung's analytical psychology, focusing on:
- Collective unconscious and archetypes (Shadow, Anima/Animus, Self, Persona)
- Symbolic interpretation (water, fire, animals, figures, etc.)
- The individuation process
- Personal unconscious content

Provide deep, insightful analysis in a compassionate and professional manner. 

IMPORTANT: You MUST respond with ONLY a valid JSON object, nothing else. Use this exact structure:
{
  "overall_interpretation": "Main interpretation of the dream",
  "archetypes": ["List of identified archetypes with brief explanations"],
  "symbols": {"symbol_name": "meaning and significance"},
  "psychological_state": "Current psychological state assessment",
  "individuation_insights": "Insights related to the individuation journey",
  "recommendations": "Suggestions for personal reflection or growth"
}

Respond in Korean. Return ONLY the JSON object, no markdown formatting, no code blocks.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
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
