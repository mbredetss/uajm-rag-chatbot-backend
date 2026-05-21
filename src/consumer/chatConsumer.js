import axios from 'axios';
import { ChatOpenRouter } from '@langchain/openrouter';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import pool from '../producer/utils/database.js';
import { getVectorStore } from './indexingConsumer.js';

const llm = new ChatOpenRouter({
  model: 'openai/gpt-oss-20b:free',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const retrieveContext = async (query) => {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearch(query, 5);
  return results;
};

const generateAnswer = async (question, relevantDocs) => {
  const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

  const systemPrompt = `You are a helpful assistant who is good at analyzing source information and answering questions.
        Use the following source documents to answer the user's questions.
        If you don't know the answer, just say that you don't know.
        Keep the answer concise.
        Documents:
        ${context}`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(question),
  ]);

  return response.content;
};

const saveConversation = async (question, answer, relevantContext) => {
  await pool.query(
    'INSERT INTO conversations (question, answer, relevant_context) VALUES ($1, $2, $3)',
    [question, answer, JSON.stringify(relevantContext)],
  );
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  await axios.post(
    `https://graph.facebook.com/v21.0/${process.env.BUSINESS_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual', 
      to: phoneNumber,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SYSTEM_USER_ACCESS_TOKEN}`,
      },
    },
  );
};

const processChat = async ({ message, phoneNumber }) => {
  try {
    const relevantDocs = await retrieveContext(message);
    const answer = await generateAnswer(message, relevantDocs);

    const relevantContext = relevantDocs.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));

    await saveConversation(message, answer, relevantContext);

    await sendWhatsAppMessage(phoneNumber, answer);

    console.log(`Chat diproses untuk ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error('Gagal memproses chat:', error);
  }
};

export { processChat, sendWhatsAppMessage };
