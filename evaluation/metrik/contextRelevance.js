import { z } from "zod";
import 'dotenv/config'; 
import { ChatGroq } from "@langchain/groq";

// Grade prompt
const retrievalRelevanceInstructions = `You are a teacher grading a quiz. You will be given a QUESTION and a set of FACTS provided by the student. Here is the grade criteria to follow:
(1) You goal is to identify FACTS that are completely unrelated to the QUESTION
(2) If the facts contain ANY keywords or semantic meaning related to the question, consider them relevant
(3) It is OK if the facts have SOME information that is unrelated to the question as long as (2) is met

Relevance:
A relevance value of True means that the FACTS contain ANY keywords or semantic meaning related to the QUESTION and are therefore relevant.
A relevance value of False means that the FACTS are completely unrelated to the QUESTION.

Explain your reasoning in a step-by-step manner to ensure your reasoning and conclusion are correct. Avoid simply stating the correct answer at the outset.`

const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    maxRetries: 15
}).withStructuredOutput(
  z
    .object({
      explanation: z
        .string()
        .describe("Explain your reasoning for the score"),
      relevant: z
        .boolean()
        .describe("True if the retrieved documents are relevant to the question, False otherwise")
    })
    .describe("Retrieval relevance score for the retrieved documents v.s. the question.")
);

async function contextRelevance({
  inputs,
  outputs,
}) {
  const docString = outputs.documents.map((doc) => doc.pageContent).join("");
  const answer = `FACTS: ${docString}
        QUESTION: ${inputs.question}`

  // Run evaluator
  const grade = await llm.invoke([{ role: "system", content: retrievalRelevanceInstructions }, { role: "user", content: answer }])
  return { key: "context_relevance", score: grade.relevant };
};

export default contextRelevance;