// src/api/client.js

// ⚠️ IP ADRESİNİ KONTROL ET:
// Bilgisayarının yerel IP adresi buraya yazılmalı.
// Terminale 'ipconfig getifaddr en0' yazarak bulabilirsin.
const BASE_URL = 'http://192.168.1.85:8000'; 

/**
 * GET İsteği atar
 */
export async function apiGet(path) {
  try {
    console.log(`📡 GET İsteği: ${BASE_URL}${path}`);
    const res = await fetch(`${BASE_URL}${path}`);
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET ${path} Hatası (${res.status}): ${text}`);
    }
    return res.json();
  } catch (error) {
    console.error("API GET Hatası:", error);
    throw error;
  }
}

/**
 * POST İsteği atar
 */
export async function apiPost(path, body) {
  try {
    console.log(`📡 POST İsteği: ${BASE_URL}${path}`, body);
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST ${path} Hatası (${res.status}): ${text}`);
    }
    return res.json();
  } catch (error) {
    console.error("API POST Hatası:", error);
    throw error;
  }
}