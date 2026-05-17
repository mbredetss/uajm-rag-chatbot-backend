import 'dotenv/config';
import { traceable } from 'langsmith/traceable';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import pool from './src/producer/utils/database.js';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-3-flash-preview',
  temperature: 0,
});

const RETRIEVAL_RELEVANCE_PROMPT = `You are a teacher grading a quiz. You will be given a QUESTION and a set of FACTS provided by the student. Here is the grade criteria to follow:
(1) You goal is to identify FACTS that are completely unrelated to the QUESTION
(2) If the facts contain ANY keywords or semantic meaning related to the question, consider them relevant
(3) It is OK if the facts have SOME information that is unrelated to the question as long as (2) is met

Relevance:
A relevance value of True means that the FACTS contain ANY keywords or semantic meaning related to the QUESTION and are therefore relevant.
A relevance value of False means that the FACTS are completely unrelated to the QUESTION.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const GROUNDEDNESS_PROMPT = `You are a teacher grading a quiz. You will be given FACTS and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is grounded in the FACTS. (2) Ensure the STUDENT ANSWER does not contain "hallucinated" information outside the scope of the FACTS.

Grounded:
A grounded value of True means that the student's answer meets all of the criteria.
A grounded value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const ANSWER_RELEVANCE_PROMPT = `You are a teacher grading a quiz. You will be given a QUESTION and a STUDENT ANSWER. Here is the grade criteria to follow:
(1) Ensure the STUDENT ANSWER is concise and relevant to the QUESTION
(2) Ensure the STUDENT ANSWER helps to answer the QUESTION

Relevance:
A relevance value of True means that the student's answer meets all of the criteria.
A relevance value of False means that the student's answer does not meet all of the criteria.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`;

const evaluateRetrievalRelevance = traceable(
  async (question, relevantContext) => {
    const facts = relevantContext
      .map((ctx) => ctx.content)
      .join('\n\n');

    const prompt = `${RETRIEVAL_RELEVANCE_PROMPT}\n\nQUESTION: ${question}\n\nFACTS: ${facts}\n\nProvide your response in JSON format: { "reasoning": "...", "score": true/false }`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(content);
  },
  { name: 'retrieval_relevance' },
);

const evaluateGroundedness = traceable(
  async (answer, relevantContext) => {
    const facts = relevantContext
      .map((ctx) => ctx.content)
      .join('\n\n');

    const prompt = `${GROUNDEDNESS_PROMPT}\n\nFACTS: ${facts}\n\nSTUDENT ANSWER: ${answer}\n\nProvide your response in JSON format: { "reasoning": "...", "score": true/false }`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(content);
  },
  { name: 'groundedness' },
);

const evaluateAnswerRelevance = traceable(
  async (question, answer) => {
    const prompt = `${ANSWER_RELEVANCE_PROMPT}\n\nQUESTION: ${question}\n\nSTUDENT ANSWER: ${answer}\n\nProvide your response in JSON format: { "reasoning": "...", "score": true/false }`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(content);
  },
  { name: 'answer_relevance' },
);

const runEvaluation = traceable(
  async () => {
    const result = await pool.query(
      'SELECT * FROM conversations ORDER BY created_at DESC',
    );
    const conversations = result.rows;

    if (conversations.length === 0) {
      console.log('Tidak ada data percakapan untuk dievaluasi');
      return;
    }

    console.log(`Mengevaluasi ${conversations.length} percakapan...\n`);

    for (const conv of conversations) {
      const { question, answer, relevant_context } = conv;
      const context = JSON.parse(relevant_context);

      console.log(`--- Evaluasi ID: ${conv.id} ---`);
      console.log(`Pertanyaan: ${question}`);
      console.log(`Jawaban: ${answer}\n`);

      const retrievalResult = await evaluateRetrievalRelevance(question, context);
      console.log('Retrieval Relevance:', retrievalResult);

      const groundednessResult = await evaluateGroundedness(answer, context);
      console.log('Groundedness:', groundednessResult);

      const relevanceResult = await evaluateAnswerRelevance(question, answer);
      console.log('Answer Relevance:', relevanceResult);

      console.log('---\n');
    }

    console.log('Evaluasi selesai. Hasil telah dicatat di LangSmith.');
  },
  { name: 'rag_evaluation' },
);

runEvaluation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Evaluasi gagal:', err);
    process.exit(1);
  });
