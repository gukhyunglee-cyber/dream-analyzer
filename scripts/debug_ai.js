
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { getAIService } = require('../services/aiService');

async function testAI() {
    console.log('Testing AI Service...');
    console.log('Provider:', process.env.AI_PROVIDER);
    console.log('Key present:', !!process.env.OPENAI_API_KEY);

    try {
        const aiService = getAIService();
        const result = await aiService.analyzeDream("Running through a field of flowers but I can't stop running.", { birth_date: '1990-01-01', gender: 'female' });

        console.log('Result success:', result.success);
        if (result.success) {
            console.log('Analysis preview:', JSON.stringify(result.analysis).substring(0, 100) + '...');
        } else {
            console.error('Analysis failed:', result.error);
        }
    } catch (err) {
        console.error('Test crashed:', err);
    }
}

testAI();
