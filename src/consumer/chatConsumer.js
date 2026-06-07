import axios from 'axios';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import pool from '../producer/utils/database.js';
import { getVectorStore } from './indexingConsumer.js';
import { ChatGroq } from '@langchain/groq';
import { traceable } from "langsmith/traceable";

const llm = new ChatGroq({
  model: 'openai/gpt-oss-120b',
});

const vectorStore = await getVectorStore();

const retrieveContext = async (query) => {
  const results = await vectorStore.similaritySearch(query, 5);
  return results;
};

const generateAnswer = async (question, relevantDocs) => {
  const sortedDocs = [...relevantDocs].sort((a, b) => {
    const dateA = new Date(a.metadata.createdAt);
    const dateB = new Date(b.metadata.createdAt);
    return dateB - dateA;
  });

  const context = sortedDocs.map((doc) => `
    Content: ${doc.pageContent}, 
    CreatedAt: ${doc.metadata.createdAt}.
  `).join('\n\n');

  const systemPrompt = `
You are a helpful assistant who is good at analyzing source information and answering questions. Your name is: "UAJM AI". 

You are assigned to answer questions based on the documents provided.

Use ONLY the source documents provided to answer. If information is not in the documents, reply with: "Sorry, I cannot answer your question. Please contact campus customer service via WhatsApp at the following link: https://wa.me/6281355049802." YOU MUST NOT perform any other tasks other than providing information. The documents below have been sorted from newest to oldest. Always prioritize information from the most recent document (at the top) if there are contradictions or the same information with different dates.

Make sure your answers support WhatsApp's markdown format. Always reply in the same language as the user in their question. Keep your answers concise. If someone asks who you are, state your name.
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

const queryReWriting = async (message) => {
  return await llm.invoke(
    ` You are a language expert, specifically Indonesian. You are tasked with clarifying user questions and translating them into Indonesian (if the question is not in Indonesian).
    Here is a list of abbreviations:
    - UAJM -> Universitas Atma Jaya Makassar
    - BAPSI -> Biro Administrasi Perencanaan dan Pengembangan Sistem Informasi
    - BAUK -> Biro Administrasi Umum dan Keuangan
    - BAA -> Biro Administrasi Akademik & Kemahasiswaan
    - LPPM -> Lembaga Penelitian dan Pengabdian kepada Masyarakat
    - BKAM -> Biro Administrasi Hubungan Masyarakat, Kemahasiswaan dan Alumni
    - FTI -> Fakultas Teknologi Informasi
    - TI -> Teknik Informatika
    - FEB -> Fakultas Ekonomi dan Bisnis
    - BKD -> Beban Kerja Dosen
    - TA -> Tugas Akhir
    If the user's question has an abbreviation that is not mentioned in the list above, then try changing the abbreviation to its full form in the academic scope.
    If there are abbreviations in the question, convert them to their ONLY full form and abbreviation.
    RULES:
    - DO NOT DO OTHER THAN WHAT YOU ARE ASSIGNED TO DO.
    - just give the question that you have clarified.
    - filter the greetings from the user's question.
    Here is the user's question: "${message}"`
  );
};

const _processChat = async ({ message, phoneNumber }) => {
  try {
    const rewrittenQuery = await queryReWriting(message);
    const relevantDocs = await retrieveContext(rewrittenQuery.content);
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

const processChat = traceable(
  _processChat,
  {
    name: "processChat",
    run_type: "chain",
    tags: ["chat"],
    metadata: { project: "uajm-rag-chatbot" },
  }
);

export { processChat, sendWhatsAppMessage };
