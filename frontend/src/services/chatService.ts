import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

interface ChatResponse {
  success: boolean
  response: string
  error?: string
}

export const sendChatMessage = async (
  message: string,
  menuContext?: any
): Promise<ChatResponse> => {
  try {
    const response = await axios.post(API_ENDPOINTS.CHAT, {
      message,
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

