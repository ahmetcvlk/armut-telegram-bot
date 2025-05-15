import { LibSQLStore } from '@mastra/libsql';
import { Worker } from '../data/data';

export class WorkerStore {
  private store: LibSQLStore;

  constructor() {
    this.store = new LibSQLStore({ url: 'file:../mastra.db' });
    this.initializeTable();
  }

  private async initializeTable() {
    await this.store.execute(`
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        fullName TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        experience INTEGER NOT NULL,
        rating REAL NOT NULL,
        reviewCount INTEGER NOT NULL,
        availability BOOLEAN NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
  }

  async addWorker(worker: Worker): Promise<void> {
    await this.store.execute(`
      INSERT INTO workers (
        id, fullName, category, location, phoneNumber,
        experience, rating, reviewCount, availability, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      worker.id,
      worker.fullName,
      worker.category,
      worker.location,
      worker.phoneNumber,
      worker.experience,
      worker.rating,
      worker.reviewCount,
      worker.availability ? 1 : 0,
      worker.createdAt.toISOString()
    ]);
  }

  async getWorker(id: string): Promise<Worker | null> {
    const result = await this.store.execute(
      'SELECT * FROM workers WHERE id = ?',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      fullName: row.fullName,
      category: row.category,
      location: row.location,
      phoneNumber: row.phoneNumber,
      experience: row.experience,
      rating: row.rating,
      reviewCount: row.reviewCount,
      availability: Boolean(row.availability),
      createdAt: new Date(row.createdAt)
    };
  }

  async updateWorker(worker: Worker): Promise<void> {
    await this.store.execute(`
      UPDATE workers SET
        fullName = ?,
        category = ?,
        location = ?,
        phoneNumber = ?,
        experience = ?,
        rating = ?,
        reviewCount = ?,
        availability = ?
      WHERE id = ?
    `, [
      worker.fullName,
      worker.category,
      worker.location,
      worker.phoneNumber,
      worker.experience,
      worker.rating,
      worker.reviewCount,
      worker.availability ? 1 : 0,
      worker.id
    ]);
  }

  async deleteWorker(id: string): Promise<void> {
    await this.store.execute(
      'DELETE FROM workers WHERE id = ?',
      [id]
    );
  }

  async listWorkers(category?: string): Promise<Worker[]> {
    let query = 'SELECT * FROM workers';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const result = await this.store.execute(query, params);
    return result.rows.map(row => ({
      id: row.id,
      fullName: row.fullName,
      category: row.category,
      location: row.location,
      phoneNumber: row.phoneNumber,
      experience: row.experience,
      rating: row.rating,
      reviewCount: row.reviewCount,
      availability: Boolean(row.availability),
      createdAt: new Date(row.createdAt)
    }));
  }
} 