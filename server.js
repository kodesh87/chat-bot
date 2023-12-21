import express from 'express';
import path from 'path'; // Tambahkan ini
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { retriever } from './utils/retriever.js'
import { combineDocuments } from './utils/document.js'
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"
import bodyParser from 'body-parser';
import { request } from 'http';

const openAIApiKey = process.env.OPENAI_API_KEY
const llm = new ChatOpenAI({ openAIApiKey })

// standalone prompt template
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:'
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

// Q&A prompt template
const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Social VPS based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@socialvps.net. Don't try to make up an answer. Always speak as you are Social VPS agent and you were chatting to a friend and speak according the language of the question.
context: {context}
question: {question}
answer: `
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

/**
 * Super Challenge:
 * 
 * Set up a RunnableSequence so that the standaloneQuestionPrompt 
 * passes the standalone question to the retriever, and the retriever
 * passes the combined docs as context to the answerPrompt. Remember, 
 * the answerPrompt should also have access to the original question. 
 * 
 * When you have finished the challenge, you should see a 
 * conversational answer to our question in the console.
 * 
**/

// chains
const standaloneQuestionChain = RunnableSequence.from([
    standaloneQuestionPrompt,
    llm,
    new StringOutputParser()
]);
const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retriever,
    combineDocuments
]);
const answerChain = RunnableSequence.from([
    answerPrompt,
    llm,
    new StringOutputParser()
]);

// main chain
const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    }, 
    {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question 
    },
    // prevResult => console.log(prevResult),
    answerChain
]);
// standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retriever).pipe(combineDocuments).pipe(answerPrompt);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = express();
const PORT = 3000;

// Menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/chat', async (req, res) => {
  const requestData = req.body;
  console.log(requestData);

  // Lakukan sesuatu dengan data (contoh: tampilkan di console)
  console.log('Received POST request with data: ', requestData);

  // const response = 'helo';
  const response = await chain.invoke({
      question: requestData.question
  })

  // Kirim respons ke client
  res.status(200).json({ message: 'Data received successfully', data: { question: requestData.question, answer: response } });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});