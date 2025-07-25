import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const addressSchema = {
    type: Type.OBJECT,
    properties: {
        address: { 
            type: Type.STRING, 
            description: "The complete formatted address extracted from the image. Include street number, street name, city, state/province, postal code, and country if visible." 
        },
        confidence: { 
            type: Type.NUMBER, 
            description: "Confidence level from 0 to 1 indicating how certain the AI is about the extracted address." 
        },
        notes: { 
            type: Type.STRING, 
            description: "Any additional notes about the address or context from the image (e.g., 'Business address', 'Home address', 'Mailing address')." 
        }
    },
    required: ["address", "confidence", "notes"],
};

export interface AddressResult {
    address: string;
    confidence: number;
    notes: string;
}

export const scanAddressFromImage = async (base64Image: string, mimeType: string): Promise<AddressResult> => {
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };

    const textPart = {
        text: `Analyze this image and extract any address information you can find. This could be from:
        - Mail/letters/envelopes
        - Business cards
        - Signs or building addresses
        - Documents with address fields
        - Any other text containing address information
        
        Extract the complete address and format it properly. If you see partial address information, do your best to reconstruct a complete address. Provide a confidence score based on how clear and complete the address information is.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: addressSchema,
            }
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error("AI returned an empty response.");
        }
        
        const parsedData = JSON.parse(jsonString);

        return {
            address: parsedData.address || '',
            confidence: parsedData.confidence || 0,
            notes: parsedData.notes || '',
        };
    } catch (error) {
        console.error("Error scanning address with Gemini API:", error);
        throw new Error("Failed to analyze the image for address information. Please try again or enter the address manually.");
    }
};
