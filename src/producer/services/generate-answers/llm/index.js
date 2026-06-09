/* istanbul ignore file */
import 'dotenv/config';
import { ChatGroq } from '@langchain/groq';

const llm = new ChatGroq({
  model: 'openai/gpt-oss-120b',
});

export default llm;