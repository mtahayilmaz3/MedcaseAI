const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!RAW_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is missing (.env)");
}

// Sonundaki /'leri temizle: http://192.168.1.103:8000/
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

function buildUrl(path) {
  // path "/dialogue/start" veya "dialogue/start" gelse de düzgünleştir
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

async function readErrorBody(res) {
  const ct = res.headers.get("content-type") || "";

  // FastAPI çoğunlukla JSON {"detail": "..."} döner
  if (ct.includes("application/json")) {
    try {
      const j = await res.json();
      // detail varsa onu öne çıkar
      if (j && typeof j === "object" && "detail" in j) {
        return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      }
      return JSON.stringify(j);
    } catch {
      // JSON parse edilemezse text'e düş
    }
  }

  try {
    const t = await res.text();
    return t || "<empty body>";
  } catch {
    return "<failed to read response body>";
  }
}

export async function apiGet(path) {
  const url = buildUrl(path);
  console.log("API GET =>", url);

  const res = await fetch(url);

  if (!res.ok) {
    const body = await readErrorBody(res);
    console.log("API ERROR BODY =>", body);
    throw new Error(`GET ${path} failed (${res.status} ${res.statusText}): ${body}`);
  }

  return res.json();
}

export async function apiPost(path, body) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const respBody = await readErrorBody(res);
    throw new Error(`POST ${path} failed (${res.status} ${res.statusText}): ${respBody}`);
  }

  return res.json();
}