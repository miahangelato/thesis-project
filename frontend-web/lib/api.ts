import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Session endpoints
export const sessionAPI = {
    start: (consent: boolean) =>
        api.post('/session/start', { consent }),

    submitDemographics: (sessionId: string, data: {
        age: number
        weight_kg: number
        height_cm: number
        gender: string
    }) =>
        api.post(`/session/${sessionId}/demographics`, data),

    submitFingerprint: (sessionId: string, data: {
        finger_name: string
        image: string
    }) =>
        api.post(`/session/${sessionId}/fingerprint`, data),

    analyze: (sessionId: string) =>
        api.post(`/session/${sessionId}/analyze`),

    getResults: (sessionId: string) =>
        api.get(`/session/${sessionId}/results`),

    generatePDF: (sessionId: string) =>
        api.post(`/session/${sessionId}/generate-pdf`),

    downloadPDF: (sessionId: string) =>
        api.get(`/session/${sessionId}/download-pdf`),
}

// Health check
export const healthCheck = () => api.get('/health')
