
import { GoogleGenAI, Type } from "@google/genai";
import type { PartialContact } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A more user-friendly message could be shown in the UI
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const contactSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Full name of the person." },
        email: { type: Type.STRING, description: "Email address." },
        phoneWork: { type: Type.STRING, description: "Work phone number (office, landline)." },
        phoneMobile: { type: Type.STRING, description: "Mobile phone number (cell)." },
        company: { type: Type.STRING, description: "Company name." },
        title: { type: Type.STRING, description: "Job title or position." },
        address: { type: Type.STRING, description: "Full mailing or office address." },
        website: { type: Type.STRING, description: "Company or personal website URL, extracted from the card." },
        notes: { type: Type.STRING, description: "Any other relevant information or notes from the card." },
        groups: {
            type: Type.ARRAY,
            description: "Suggest up to three relevant groups based on the person's industry or role (e.g., 'Work', 'Colleague', 'Sales').",
            items: { type: Type.STRING }
        }
    },
    required: ["name", "email", "phoneWork", "phoneMobile", "company", "title", "address", "website", "notes", "groups"],
};

export const parseBusinessCard = async (base64Image: string, mimeType: string): Promise<PartialContact> => {
  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image,
    },
  };

  const textPart = {
    text: "Analyze this business card image and extract the contact information. Distinguish between work and mobile phone numbers if possible. Extract the website URL. Provide the output as a JSON object matching the provided schema. If a piece of information is not present on the card, return an empty string for that field.",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: contactSchema,
      }
    });

    const jsonString = response.text;
    if (!jsonString) {
        throw new Error("API returned an empty response.");
    }
    
    // The response is already a JSON string, so we just parse it.
    const parsedData = JSON.parse(jsonString);

    // Ensure all fields are present, even if empty, to match the PartialContact type
    return {
        name: parsedData.name || '',
        email: parsedData.email || '',
        phoneWork: parsedData.phoneWork || '',
        phoneMobile: parsedData.phoneMobile || '',
        company: parsedData.company || '',
        title: parsedData.title || '',
        address: parsedData.address || '',
        website: parsedData.website || '',
        notes: parsedData.notes || '',
        groups: parsedData.groups || [],
    };
  } catch (error) {
    console.error("Error parsing business card with Gemini API:", error);
    throw new Error("Failed to analyze the business card. Please try again or enter the details manually.");
  }
};

export const parseTextToContact = async (text: string): Promise<PartialContact> => {
    const prompt = `
        Analyze the following text, which could be from a plain text file or a document, and extract the contact information. 
        Structure the output as a JSON object matching the provided schema. 
        If a piece of information is not present in the text, return an empty string for that field.
        
        Text to analyze:
        ---
        ${text}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: contactSchema,
            }
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error("AI returned an empty response.");
        }
        
        const parsedData = JSON.parse(jsonString);

        return {
            name: parsedData.name || '',
            email: parsedData.email || '',
            phoneWork: parsedData.phoneWork || '',
            phoneMobile: parsedData.phoneMobile || '',
            company: parsedData.company || '',
            title: parsedData.title || '',
            address: parsedData.address || '',
            website: parsedData.website || '',
            notes: parsedData.notes || '',
            groups: parsedData.groups || [],
        };
    } catch (error) {
        console.error("Error parsing text with Gemini API:", error);
        throw new Error("Failed to analyze the text. Please try again or enter the details manually.");
    }
};


export interface IntelData {
  summary: string;
  sources: { uri: string; title: string; }[];
}

export const getContactIntel = async (name: string, company: string): Promise<IntelData> => {
  const prompt = `
    Act as a professional research assistant.
    Your goal is to provide a concise intelligence report on a professional contact.
    
    Contact Name: "${name}"
    Company: "${company}"

    Please find and summarize the following information using a web search:
    1.  **Company Overview:** What does "${company}" do? What are its key products or services?
    2.  **Professional Profile:** Find the LinkedIn profile for "${name}", preferably associated with "${company}".
    3.  **Social Presence:** Briefly mention any other significant professional online presence (e.g., Twitter/X, professional blog, GitHub).
    4.  **Recent Activity:** Mention any very recent news, articles, or significant achievements related to the person or company if available.

    Structure your response as a brief, professional summary. Do not use markdown.
    Be concise and focus on the most relevant information for someone about to engage with this contact.
    If you cannot find specific information (e.g., a LinkedIn profile), state that it was not readily found.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const summary = response.text;
    if (!summary) {
        throw new Error("AI returned an empty summary.");
    }
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web)
        .filter(web => web?.uri)
        // Deduplicate sources based on URI
        .filter((web, index, self) => 
            index === self.findIndex((t) => (
                t && web && t.uri === web.uri
            ))
        ) as { uri: string; title: string; }[] || [];

    return { summary, sources };
  } catch (error) {
    console.error("Error fetching contact intel with Gemini API:", error);
    throw new Error("Failed to generate AI-powered insights. The model may be unavailable or the request could not be processed.");
  }
};