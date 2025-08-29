import axios from 'axios';
import { AestheticAnalysis } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  async analyzeAesthetic(userInput: string): Promise<AestheticAnalysis> {
    try {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert aesthetic analyst. Parse user descriptions of style preferences and extract specific elements. Return a JSON object with:
              - style: main aesthetic category
              - colors: array of color preferences
              - keywords: specific style descriptors
              - categories: product categories to search
              - mood: overall emotional tone`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze aesthetic preferences');
    }
  }

  async generateProductDescription(product: any, aesthetic: AestheticAnalysis): Promise<string> {
    try {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Create a personalized product description that explains how this product fits the user's ${aesthetic.style} aesthetic. Be specific about style elements and why it matches their vibe.`
            },
            {
              role: 'user',
              content: `Product: ${product.title}\nAesthetic: ${aesthetic.style}\nMood: ${aesthetic.mood}`
            }
          ],
          temperature: 0.8,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI description generation error:', error);
      return 'This product matches your aesthetic preferences.';
    }
  }
}

export const openaiService = new OpenAIService();