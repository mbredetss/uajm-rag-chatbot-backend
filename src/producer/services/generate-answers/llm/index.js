/* istanbul ignore file */
import 'dotenv/config';
import { ChatGroq } from '@langchain/groq';

const llmGenerateAnswer = new ChatGroq({
  model: 'llama-3.3-70b-versatile', 
  apiKey: process.env.GROQ_API_KEY_GENERATE_ANSWER,
  
});

const llmQueryRewrite = new ChatGroq({
  model: 'openai/gpt-oss-120b',
  apiKey: process.env.GROQ_API_KEY_QUERY_REWRITING,
});

export { llmGenerateAnswer, llmQueryRewrite };