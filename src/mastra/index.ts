import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';
import { weatherAgent } from './agents';
import { workerAgent } from './agents/workerAgent';
import { Worker } from './data/data';
import { WorkerStore } from './db/workerStore';

export const mastra = new Mastra({
  agents: { weatherAgent, workerAgent },
  storage: new LibSQLStore({ url: ":memory:" }),
  logger: createLogger({ name: 'Mastra', level: 'info' }),
});

// Bot kısmı:
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { data } from './data/data';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const workerStore = new WorkerStore();

const userStates = new Map();
const workerRegistrationStates = new Map();

// Statik işçi listesi
const workers: Worker[] = [];

// İşçi kayıt komutu
bot.command('isci_ekle', async (ctx) => {
  const userId = ctx.from.id;
  workerRegistrationStates.set(userId, {
    status: 'collecting',
    currentField: 'fullName',
    collectedData: {}
  });
  
  await ctx.reply('İşçi kayıt sürecini başlatıyoruz. Lütfen adınızı ve soyadınızı giriniz:');
});

// İşçi listesi komutu
bot.command('isci_listesi', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const category = args[1]; // Opsiyonel kategori filtresi

  const filtered = category
    ? workers.filter(w => w.category.toLowerCase() === category.toLowerCase())
    : workers;

  if (filtered.length === 0) {
    await ctx.reply('Kayıtlı işçi bulunamadı.');
    return;
  }

  const message = `📋 *İşçi Listesi${category ? ` - ${category}` : ''}*\n\n` +
    filtered.map((w, index) =>
      `${index + 1}. ${w.fullName} - ${w.location} (${w.rating} ⭐)`
    ).join('\n');

  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Mevcut text handler'ı güncelle
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userInput = ctx.message.text.trim();

  // İşçi kayıt durumunu kontrol et
  const workerState = workerRegistrationStates.get(userId);
  if (workerState && workerState.status === 'collecting') {
    try {
      const response = await workerAgent.generate([
        { role: "user", content: userInput },
      ]);

      const raw = response.text.trim();
      const cleaned = raw.replace(/^```json|```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.status === 'collecting') {
        workerState.collectedData[parsed.currentField] = userInput;
        workerState.currentField = parsed.currentField;

        const questions = {
          fullName: 'Adınızı ve soyadınızı giriniz:',
          category: 'Hangi kategoride hizmet vereceksiniz? (Cleaning, Plumbing, Electrician, Painting)',
          location: 'Hangi şehirde hizmet vereceksiniz?',
          phoneNumber: 'Telefon numaranızı giriniz:',
          experience: 'Kaç yıllık deneyiminiz var?'
        };

        await ctx.reply(questions[parsed.currentField]);
      } else if (parsed.status === 'complete') {
        // Yeni işçiyi kaydet
        const newWorker: Worker = {
          id: Date.now().toString(),
          ...parsed.collectedData,
          rating: 0,
          reviewCount: 0,
          availability: true,
          createdAt: new Date()
        };
        workers.push(newWorker);
        await ctx.reply('İşçi kaydınız başarıyla tamamlandı! 🎉');
        workerRegistrationStates.delete(userId);
      }
    } catch (err) {
      console.error('İşçi kayıt hatası:', err);
      await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    return;
  }

  const existing = userStates.get(userId);

  if (existing && existing.waitingFor) {
    const field = existing.waitingFor;
    existing[field] = userInput;
    existing.waitingFor = undefined;

    const remaining = ['location', 'date', 'time'].filter(key => !existing[key]);

    if (remaining.length > 0) {
      existing.waitingFor = remaining[0];
      const nextQuestion = {
        location: "Lütfen konumunuzu belirtir misiniz?",
        date: "Hangi gün için randevu oluşturmak istersiniz?",
        time: "Saat kaçta hizmet almak istiyorsunuz?",
      }[existing.waitingFor];
      await ctx.reply(nextQuestion);
      return;
    }

    const categoryData = data.serviceCategories.find(
      (cat) => cat.categoryName.toLowerCase() === existing.category.toLowerCase()
    );

    if (!categoryData) {
      await ctx.reply("Bu kategoriye ait bir veri bulunamadı.");
      userStates.delete(userId);
      return;
    }

    const availableProviders = categoryData.providers.filter(
      (p) =>
        p.availability &&
        (!existing.location || p.location.toLowerCase().includes(existing.location.toLowerCase()))
    );


    if (availableProviders.length === 0) {
      await ctx.reply("Bu kategoride şu anda müsait görevli bulunmamaktadır.");
      userStates.delete(userId);
      return;
    }

    const message = `🧾 *Müsait Görevliler – ${existing.category}*\n\n` +
      availableProviders.map((p, index) =>
        `${index + 1}. ${p.fullName} – ${p.location} (${p.rating} ⭐)`
      ).join('\n');

    await ctx.reply(message, { parse_mode: 'Markdown' });
    userStates.delete(userId);
    return;
  }

  try {
    const response = await weatherAgent.generate([
      { role: "user", content: userInput },
    ]);

    const raw = response.text.trim();
    const cleaned = raw.replace(/^```json|```$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const { category, missing } = parsed;

    const state: Record<string, any> = {
      category,
      location: undefined,
      date: undefined,
      time: undefined,
      waitingFor: undefined,
    };

    if (missing && missing.length > 0) {
      state.waitingFor = missing[0];
      userStates.set(userId, state);

      const questions: Record<string, string> = {
        location: "Lütfen konumunuzu belirtir misiniz?",
        date: "Hangi gün için randevu oluşturmak istersiniz?",
        time: "Saat kaçta hizmet almak istiyorsunuz?",
      };

      await ctx.reply(questions[state.waitingFor]);
      return;
    }

    const categoryData = data.serviceCategories.find(
      (cat) => cat.categoryName.toLowerCase() === category.toLowerCase()
    );

    if (!categoryData) {
      await ctx.reply("Bu kategoriye ait bir veri bulunamadı.");
      return;
    }

    const availableProviders = categoryData.providers.filter(
      (p) =>
        p.availability &&
        (!state.location || p.location.toLowerCase().includes(state.location.toLowerCase()))
    );


    if (availableProviders.length === 0) {
      await ctx.reply("Bu kategoride şu anda müsait görevli bulunmamaktadır.");
      return;
    }

    const message = `🧾 *Müsait Görevliler – ${category}*\n\n` +
      availableProviders.map((p, index) =>
        `${index + 1}. ${p.fullName} – ${p.location} (${p.rating} ⭐)`
      ).join('\n');

    await ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('Hata:', err);
    await ctx.reply('Bir hata oluştu.');
  }
});

bot.launch().then(() => {
  console.log('Telegram botu başlatıldı!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
