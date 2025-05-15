import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { Worker } from '../data/data';

export const workerAgent = new Agent({
  name: 'Worker Registration Agent',
  instructions: `
    İşçi kayıt sürecini yönet. Kullanıcıdan sırasıyla şu bilgileri al:
    - Ad Soyad
    - Kategori (Cleaning, Plumbing, Electrician, Painting)
    - Konum
    - Telefon Numarası
    - Deneyim (yıl)

    Her adımda kullanıcıya uygun soruyu sor ve cevabı doğrula.
    Tüm bilgiler tamamlandığında, bilgileri JSON formatında döndür.

    Yanıt formatı:
    {
      "status": "collecting" | "complete",
      "currentField": "fullName" | "category" | "location" | "phoneNumber" | "experience" | null,
      "collectedData": {
        "fullName": string,
        "category": string,
        "location": string,
        "phoneNumber": string,
        "experience": number
      }
    }
  `,
  model: google('gemini-2.5-flash-preview-04-17'),
  memory: new Memory({
    storage: new LibSQLStore({ url: 'file:../mastra.db' }),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: { generateTitle: false },
    },
  }),
}); 