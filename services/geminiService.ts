
import { GoogleGenAI, Chat, FunctionDeclaration, GenerateContentResponse, Part, Tool, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI;
let chat: Chat;

// --- Mocked External APIs ---

const get_calendar_availability = () => {
  console.log("TOOL CALLED: get_calendar_availability");
  const now = new Date();
  const availableSlots = [];
  for (let i = 1; i < 5; i++) {
    const slot = new Date(now.getTime() + i * 24 * 60 * 60 * 1000); // Next few days
    slot.setHours(10 + i, 30, 0, 0); // At different times
    availableSlots.push(slot.toISOString());
  }
  return { availableSlots };
};

const book_meeting = (datetime: string, user_email: string, user_name: string, notes: string) => {
  console.log("TOOL CALLED: book_meeting with", { datetime, user_email, user_name, notes });
  return { success: true, message: `Meeting confirmed for ${user_name} at ${new Date(datetime).toLocaleString()}. An invite has been sent to ${user_email}.` };
};

const log_lead_in_crm = (full_name: string, email: string, company_name: string | undefined, lead_status: 'Hot' | 'Nurture', chat_transcript: string) => {
  console.log("TOOL CALLED: log_lead_in_crm with", { full_name, email, company_name, lead_status, chat_transcript });
  return { success: true, crm_id: `lead_${Date.now()}` };
};

const get_content = (topic: string) => {
  console.log("TOOL CALLED: get_content for topic:", topic);
  return { 
    content_url: 'https://example.com/ebook-on-getting-started.pdf', 
    content_title: 'Free E-book: The Ultimate Guide to Getting Started' 
  };
};

const availableTools: { [key: string]: Function } = {
  get_calendar_availability,
  book_meeting,
  log_lead_in_crm,
  get_content,
};

// --- Gemini Function Declarations ---

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_calendar_availability',
        description: 'Fetches a list of available 30-minute slots from the sales team\'s calendar.',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'book_meeting',
        description: 'Schedules a meeting on the calendar, sends an invite, and adds notes.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            datetime: { type: Type.STRING, description: 'The ISO 8601 datetime string for the meeting.' },
            user_email: { type: Type.STRING, description: 'The email address of the user.' },
            user_name: { type: Type.STRING, description: 'The full name of the user.' },
            notes: { type: Type.STRING, description: 'A summary of the conversation and user needs.' },
          },
          required: ['datetime', 'user_email', 'user_name', 'notes'],
        },
      },
      {
        name: 'log_lead_in_crm',
        description: 'Creates or updates a contact in the CRM with all captured information.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING, description: 'The full name of the lead.' },
            email: { type: Type.STRING, description: 'The email address of the lead.' },
            company_name: { type: Type.STRING, description: 'The company name of the lead, if provided.' },
            lead_status: { type: Type.STRING, description: "The qualification status of the lead. Either 'Hot' or 'Nurture'.", enum: ['Hot', 'Nurture'] },
            chat_transcript: { type: Type.STRING, description: 'The full transcript of the conversation.' },
          },
          required: ['full_name', 'email', 'lead_status', 'chat_transcript'],
        },
      },
      {
        name: 'get_content',
        description: 'Fetches the URL for a piece of content (e.g., e-book) based on a topic.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: 'The topic the user was interested in.' },
          },
          required: ['topic'],
        },
      },
    ] as FunctionDeclaration[],
  },
];

// --- Service Initialization and Logic ---

export const initializeChat = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    alert("API_KEY is not configured. Please set the API_KEY environment variable.");
    return;
  }
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: tools,
  });
};

export const getBigbradeResponse = async (message: string): Promise<string> => {
  if (!chat) {
    throw new Error("Chat not initialized. Call initializeChat first.");
  }

  let response: GenerateContentResponse = await chat.sendMessage({ message: message });

  while (response.functionCalls && response.functionCalls.length > 0) {
    const functionCalls = response.functionCalls;
    const functionResponses: Part[] = [];

    for (const call of functionCalls) {
      const { name, args } = call;
      if (name in availableTools) {
        const result = availableTools[name](...Object.values(args));
        functionResponses.push({
          functionResponse: {
            name,
            response: result,
          },
        });
      }
    }
    
    response = await chat.sendMessage({ message: '', toolResponses: functionResponses });
  }

  return response.text;
};
