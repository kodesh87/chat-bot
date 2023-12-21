import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import dotenv from 'dotenv';

dotenv.config();

// document.addEventListener('submit', (e) => {
//     e.preventDefault()
//     progressConversation()
// })

const openAIApiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey });

/**
 * Challenge:
 * 1. Create a prompt to turn a user's question into a 
 *    standalone question. (Hint: the AI understands 
 *    the concept of a standalone question. You don't 
 *    need to explain it, just ask for it.)
 * 2. Create a chain with the prompt and the model.
 * 3. Invoke the chain remembering to pass in a question.
 * 4. Log out the response.
 * **/

// A string holding the phrasing of the prompt
const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. Question: {questionText}, standalone question:';

// A prompt created using PromptTemplate and the fromTemplate method
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

// Take the standaloneQuestionPrompt and PIPE the model
const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm);

// Await the response when you INVOKE the chain. 
// Remember to pass in a question.
const response = await standaloneQuestionChain.invoke({ questionText: 'Saya ini lapar sekali, apa aja sih menu yang kalian tawarkan?. Saya ingin makan segera, yang paling murah yah!' });

console.log(response.content);

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