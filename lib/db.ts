import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Ensure db.json exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ clients: [], appointments: [] }, null, 2));
}

export const getData = () => {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
};

export const saveData = (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};
