// src/api/endpoints.js
import { apiGet, apiPost } from "./client";

// --- MEVCUT FONKSİYONLAR ---

// Vaka Listesini Getir
export const listCases = () => apiGet("/cases");

// Tekil Vaka Detayını Getir
export const getCaseById = (id) => apiGet(`/cases/${id}`);

// Dialogue Agent Başlat (Rastgele Vaka)
export const startDialogue = () => apiGet("/dialogue/start");

// Dialogue Agent ile Sohbet Et
export const chatDialogue = (dialogueId, message) =>
  apiPost(`/dialogue/${dialogueId}/chat`, { message });

// --- YENİ EKLENEN: TUTOR AGENT (Hoca Modu) ---
export const askTutor = (caseId, message, mode = "explain") => {
  return apiPost("/tutor/ask", {
    case: { id: caseId },      // Backend vakayı ID'den bulacak
    user: { ask: message },    // Öğrencinin sorusu
    mode: mode,                // 'explain', 'hint' veya 'teach'
    language: "tr",            // Türkçe yanıt istiyoruz
    userLevel: "beginner"
  });
};