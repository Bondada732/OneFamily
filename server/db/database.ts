import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory relational storage with file persistence (robust, fast, zero native binary compilation issues)
export interface DBStore {
  families: any[];
  users: any[];
  permissions: any[];
  member_permissions: any[];
  devices: any[];
  audit_logs: any[];
  expense_categories: any[];
  expenses: any[];
  budgets: any[];
  investments: any[];
  insurance_policies: any[];
  liabilities: any[];
  goals: any[];
  calendar_events: any[];
  reminders: any[];
  document_categories: any[];
  documents: any[];
  emergency_contacts: any[];
  emergency_profiles: any[];
  memories: any[];
  voice_memories: any[];
  tasks: any[];
  grocery_items: any[];
  maintenance_items: any[];
  notifications: any[];
  ai_conversations: any[];
}

const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

class DatabaseService {
  private data: DBStore = {
    families: [],
    users: [],
    permissions: [],
    member_permissions: [],
    devices: [],
    audit_logs: [],
    expense_categories: [],
    expenses: [],
    budgets: [],
    investments: [],
    insurance_policies: [],
    liabilities: [],
    goals: [],
    calendar_events: [],
    reminders: [],
    document_categories: [],
    documents: [],
    emergency_contacts: [],
    emergency_profiles: [],
    memories: [],
    voice_memories: [],
    tasks: [],
    grocery_items: [],
    maintenance_items: [],
    notifications: [],
    ai_conversations: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.initialized = true;
        console.log('📦 Database loaded from persistence store.');
        return;
      } catch (err) {
        console.error('Failed to parse persistent data, reinitializing...', err);
      }
    }

    this.save();
    this.initialized = true;
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public getTable<K extends keyof DBStore>(tableName: K): DBStore[K] {
    if (!this.data[tableName]) {
      this.data[tableName] = [] as any;
    }
    return this.data[tableName];
  }

  public resetData(newData: DBStore) {
    this.data = newData;
    this.save();
  }

  public find<K extends keyof DBStore>(tableName: K, predicate: (item: any) => boolean): any[] {
    return this.getTable(tableName).filter(predicate);
  }

  public findOne<K extends keyof DBStore>(tableName: K, predicate: (item: any) => boolean): any | undefined {
    return this.getTable(tableName).find(predicate);
  }

  public insert<K extends keyof DBStore>(tableName: K, record: any): any {
    this.getTable(tableName).push(record);
    this.save();
    return record;
  }

  public update<K extends keyof DBStore>(tableName: K, predicate: (item: any) => boolean, updates: Partial<any>): any | null {
    const table = this.getTable(tableName);
    const index = table.findIndex(predicate);
    if (index !== -1) {
      table[index] = { ...table[index], ...updates };
      this.save();
      return table[index];
    }
    return null;
  }

  public delete<K extends keyof DBStore>(tableName: K, predicate: (item: any) => boolean): boolean {
    const table = this.getTable(tableName);
    const initialLen = table.length;
    this.data[tableName] = table.filter((item) => !predicate(item)) as any;
    const removed = this.data[tableName].length < initialLen;
    if (removed) {
      this.save();
    }
    return removed;
  }
}

export const db = new DatabaseService();
export default db;
