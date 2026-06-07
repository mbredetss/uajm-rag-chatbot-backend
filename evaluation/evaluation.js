import { evaluate } from "langsmith/evaluation";
import { traceable } from "langsmith/traceable";
import contextRelevance from "./metrik/contextRelevance.js";
import groundedness from "./metrik/Groundedness.js";
import answerRelevance from "./metrik/answerRelevance.js";
import { getVectorStore } from "../src/consumer/indexingConsumer.js";
import 'dotenv/config';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq"

const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    maxRetries: 15, 
});

const vectorStore = await getVectorStore();

const ragBot = traceable(async (question) => {
    const retrievedDocs = await vectorStore.similaritySearch(question, 5);

    const sortedDocs = [...retrievedDocs].sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateB - dateA;
    });

    const docsContent = sortedDocs.map((doc) => `
    Content: ${doc.pageContent}, 
    CreatedAt: ${doc.metadata.createdAt}.
  `).join('\n\n');

    const systemPrompt = `
You are a helpful assistant who is good at analyzing source information and answering questions. Your name is: "UAJM AI". 

You are assigned to answer questions based on the documents provided.

Use ONLY the source documents provided to answer. If information is not in the documents, reply with: "Sorry, I cannot answer your question. Please contact campus customer service via WhatsApp at the following link: https://wa.me/6281355049802." YOU MUST NOT perform any other tasks other than providing information. The documents below have been sorted from newest to oldest. Always prioritize information from the most recent document (at the top) if there are contradictions or the same information with different dates.

Make sure your answers support WhatsApp's markdown format. Always reply in the same language as the user in their question. Keep your answers concise. If someone asks who you are, state your name.
Documents:
${docsContent}`;

    const aiMsg = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(question),
    ]);

    return { "answer": aiMsg.content, "documents": retrievedDocs }
});

const targetFunc = (inputs) => {
    return ragBot(inputs.question);
};

const experimentResults = await evaluate(targetFunc, {
    data: "Dataset UAJM Chatbot",
    evaluators: [contextRelevance, groundedness, answerRelevance],
    experimentPrefix: "rag-doc-relevance",
    metadata: { version: "LCEL context, openai/gpt-oss-120b" },
});

export default llm;