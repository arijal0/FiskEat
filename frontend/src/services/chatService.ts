import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

interface ChatResponse {
  success: boolean
  response: string
  error?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UserPreferences {
  diet?: string
  allergies?: string[]
  goals?: string
}

export const sendChatMessage = async (
  history: ChatMessage[],
  userPreferences?: UserPreferences | null,
  menuContext?: any
): Promise<ChatResponse> => {
  try {
    const response = await axios.post(API_ENDPOINTS.CHAT, {
      history,
      userPreferences,
      menuContext,
    })

    return response.data
  } catch (error: any) {
    console.error('Chat service error:', error)
    return {
      success: false,
      response: 'Sorry, I encountered an error. Please try again.',
      error: error.message,
    }
  }
}

