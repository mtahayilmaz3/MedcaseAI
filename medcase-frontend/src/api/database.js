import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('medcase.db');

export const initDatabase = () => {
db.execSync(`
CREATE TABLE IF NOT EXISTS case_stats (
id INTEGER PRIMARY KEY AUTOINCREMENT,
case_id TEXT,
specialty TEXT,
score INTEGER,
duration_seconds INTEGER,
completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
id INTEGER PRIMARY KEY AUTOINCREMENT,
case_id TEXT,
role TEXT,
text TEXT,
timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
};

// İstatistikleri Kaydet
export const saveCaseResult = (caseId, specialty, score, duration) => {
db.runSync(
'INSERT INTO case_stats (case_id, specialty, score, duration_seconds) VALUES (?, ?, ?, ?)',
[caseId, specialty, score, duration]
);
};

// Özet İstatistikleri Getir (Dashboard için)
export const getGlobalStats = () => {
return db.getFirstSync(`
SELECT
COUNT(*) as totalSolved,
AVG(score) as avgScore
FROM case_stats
`);
};

// Mesaj Kaydet ve Geçmişi Getir
export const saveMessage = (caseId, role, text) => {
db.runSync('INSERT INTO messages (case_id, role, text) VALUES (?, ?, ?)', [caseId, role, text]);
};

export const getChatHistory = (caseId) => {
return db.getAllSync('SELECT role, text FROM messages WHERE case_id = ? ORDER BY timestamp ASC', [caseId]);
};