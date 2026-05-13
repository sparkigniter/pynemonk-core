import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.resolve(__dirname, '../../../../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'pynemonk.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
}

export class Logger {
    private static formatMessage(level: LogLevel, message: string, context?: any): string {
        const timestamp = new Date().toISOString();
        const ctxStr = context ? ` | ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${ctxStr}\n`;
    }

    private static writeToFile(msg: string) {
        try {
            fs.appendFileSync(LOG_FILE, msg);
        } catch (err) {
            console.error('Failed to write to log file', err);
        }
    }

    static info(message: string, context?: any) {
        const msg = this.formatMessage(LogLevel.INFO, message, context);
        console.log(msg.trim());
        this.writeToFile(msg);
    }

    static warn(message: string, context?: any) {
        const msg = this.formatMessage(LogLevel.WARN, message, context);
        console.warn(msg.trim());
        this.writeToFile(msg);
    }

    static error(message: string, context?: any) {
        const msg = this.formatMessage(LogLevel.ERROR, message, context);
        console.error(msg.trim());
        this.writeToFile(msg);
    }

    static getLogs(limit: number = 100): string[] {
        if (!fs.existsSync(LOG_FILE)) return [];
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = content.split('\n').filter(Boolean);
        return lines.slice(-limit).reverse();
    }

    static clearLogs() {
        if (fs.existsSync(LOG_FILE)) {
            fs.writeFileSync(LOG_FILE, '');
        }
    }
}
