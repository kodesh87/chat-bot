import { ChatOpenAI } from 'langchain/chat_models/openai'
import { PromptTemplate } from 'langchain/prompts'
import { StringOutputParser } from 'langchain/schema/output_parser'
import { retriever } from './utils/retriever.js'
import { combineDocuments } from './utils/document.js'
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable"

// document.addEventListener('submit', (e) => {
//     e.preventDefault()
//     progressConversation()
// }) 

const openAIApiKey = process.env.OPENAI_API_KEY
const llm = new ChatOpenAI({ openAIApiKey })

// standalone prompt template
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {question} standalone question:'
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

// Q&A prompt template
const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Social VPS based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@socialvps.net. Don't try to make up an answer. Always speak as if you were chatting to a friend.
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

const response = await chain.invoke({
    question: 'Saya ada 2 pertanyaan: (a) apa bagusnya Social VPS?; (b) berapa kecepatan Social VPS?; (c) dimana saja lokasi server yang tersedia?; (d) apakah bisa copy paste, caranya seperti apa?'
})

console.log(response)

async function progressConversation() {
    const userInput = document.getElementById('user-input')
    const chatbotConversation = document.getElementById('chatbot-conversation-container')
    const question = userInput.value
    userInput.value = ''

    // add human message
    const newHumanSpeechBubble = document.createElement('div')
    newHumanSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newHumanSpeechBubble)
    newHumanSpeechBubble.textContent = question
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight

    // add AI message
    const newAiSpeechBubble = document.createElement('div')
    newAiSpeechBubble.classList.add('speech', 'speech-ai')
    chatbotConversation.appendChild(newAiSpeechBubble)
    newAiSpeechBubble.textContent = result
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
}