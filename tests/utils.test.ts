/**
 * Тесты для вспомогательных функций
 * generateOTP, mapApiExercise, ratelimit
 */

import { describe, it, expect } from "vitest";

// ── ТЕСТ 6 (бонус): generateOTP — генерация одноразового кода ────────────────

describe("generateOTP — генерация 6-значного кода подтверждения", () => {

  const getOTP = async () => {
    const { generateOTP } = await import("../lib/email");
    return generateOTP;
  };

  // Нормальный ввод / нормальная работа
  it("возвращает строку из ровно 6 символов", async () => {
    const generateOTP = await getOTP();
    expect(generateOTP()).toHaveLength(6);
  });

  it("возвращает только цифры (без букв и символов)", async () => {
    const generateOTP = await getOTP();
    expect(generateOTP()).toMatch(/^\d{6}$/);
  });

  // Граничные значения — диапазон значений
  it("возвращает значение не менее 100000", async () => {
    const generateOTP = await getOTP();
    expect(Number(generateOTP())).toBeGreaterThanOrEqual(100000);
  });

  it("возвращает значение не более 999999", async () => {
    const generateOTP = await getOTP();
    expect(Number(generateOTP())).toBeLessThanOrEqual(999999);
  });

  // Edge case — коды не повторяются подряд (проверка случайности)
  it("генерирует разные коды при повторных вызовах", async () => {
    const generateOTP = await getOTP();
    const codes = new Set(Array.from({ length: 30 }, () => generateOTP()));
    // Вероятность получить менее 2 уникальных кодов из 30 — астрономически мала
    expect(codes.size).toBeGreaterThan(1);
  });

  // Edge case — тип возвращаемого значения
  it("возвращает тип string, не number", async () => {
    const generateOTP = await getOTP();
    expect(typeof generateOTP()).toBe("string");
  });

  // Edge case — отсутствуют ведущие нули в числе, но строка всегда 6 символов
  it("всегда возвращает строку длиной 6, даже если число начинается с 1", async () => {
    const generateOTP = await getOTP();
    // Запускаем много раз чтобы покрыть все диапазоны
    const results = Array.from({ length: 100 }, () => generateOTP());
    expect(results.every((r) => r.length === 6)).toBe(true);
  });
});

// ── ТЕСТ 7 (бонус): mapApiExercise — перевод упражнений ──────────────────────

describe("mapApiExercise — маппинг данных упражнения с учётом языка", () => {

  // Создаём тестовый объект упражнения
  const testExercise = {
    id: "test-001",
    name: "Neck Rolls",
    nameRu: "Вращение шеи",
    description: "Roll your head in circles slowly.",
    descriptionRu: "Вращайте головой по кругу медленно.",
    gifUrl: "https://example.com/neck.gif",
    category: "stretch" as const,
    duration: 45,
  };

  // Воспроизводим функцию mapApiExercise (она локальная в хуке, тестируем логику)
  function mapApiExercise(ex: typeof testExercise, lang: "en" | "ru" = "en") {
    const name = (lang === "ru" && ex.nameRu) ? ex.nameRu : ex.name;
    const description = (lang === "ru" && ex.descriptionRu) ? ex.descriptionRu : ex.description;
    return { id: ex.id, name, description, duration: ex.duration, gifUrl: ex.gifUrl, category: ex.category };
  }

  // Нормальный ввод — английский язык
  it("возвращает английское название при lang='en'", () => {
    const result = mapApiExercise(testExercise, "en");
    expect(result.name).toBe("Neck Rolls");
  });

  it("возвращает английское описание при lang='en'", () => {
    const result = mapApiExercise(testExercise, "en");
    expect(result.description).toBe("Roll your head in circles slowly.");
  });

  // Нормальный ввод — русский язык
  it("возвращает русское название при lang='ru'", () => {
    const result = mapApiExercise(testExercise, "ru");
    expect(result.name).toBe("Вращение шеи");
  });

  it("возвращает русское описание при lang='ru'", () => {
    const result = mapApiExercise(testExercise, "ru");
    expect(result.description).toBe("Вращайте головой по кругу медленно.");
  });

  // Edge case — нет русского перевода, fallback на английский
  it("возвращает английское название если русский перевод пустой", () => {
    const noRu = { ...testExercise, nameRu: "", descriptionRu: "" };
    const result = mapApiExercise(noRu, "ru");
    expect(result.name).toBe("Neck Rolls");
  });

  // Edge case — язык по умолчанию — английский
  it("по умолчанию использует английский язык", () => {
    const result = mapApiExercise(testExercise); // без явного lang
    expect(result.name).toBe("Neck Rolls");
  });

  // Граничное значение — id, gifUrl, duration передаются без изменений
  it("сохраняет id без изменений", () => {
    const result = mapApiExercise(testExercise, "en");
    expect(result.id).toBe("test-001");
  });

  it("сохраняет gifUrl без изменений", () => {
    const result = mapApiExercise(testExercise, "ru");
    expect(result.gifUrl).toBe("https://example.com/neck.gif");
  });

  it("сохраняет duration без изменений", () => {
    const result = mapApiExercise(testExercise, "en");
    expect(result.duration).toBe(45);
  });

  // Edge case — категория передаётся без изменений
  it("сохраняет категорию 'stretch' без изменений", () => {
    const result = mapApiExercise(testExercise, "ru");
    expect(result.category).toBe("stretch");
  });
});

// ── ТЕСТ 8 (бонус): checkRateLimit — ограничение числа запросов ───────────────

describe("checkRateLimit — обработка случая без Redis (graceful degradation)", () => {

  it("возвращает false (пропустить) если limiter равен null", async () => {
    const { checkRateLimit } = await import("../lib/ratelimit");
    const result = await checkRateLimit(null, "test-user-123");
    expect(result).toBe(false);
  });

  it("не бросает ошибку при null limiter и любом identifier", async () => {
    const { checkRateLimit } = await import("../lib/ratelimit");
    await expect(checkRateLimit(null, "")).resolves.not.toThrow();
  });

  it("не бросает ошибку при очень длинном identifier", async () => {
    const { checkRateLimit } = await import("../lib/ratelimit");
    const longId = "x".repeat(1000);
    await expect(checkRateLimit(null, longId)).resolves.toBe(false);
  });
});

// ── ТЕСТ 9 (бонус): feedbackSchema — дополнительные edge cases ────────────────

describe("feedbackSchema — edge cases обратной связи", () => {

  const getSchema = async () => {
    const { feedbackSchema } = await import("../lib/validations");
    return feedbackSchema;
  };

  // Edge case — HTML теги в сообщении (не должны влиять на валидацию Zod)
  it("принимает сообщение с HTML тегами (XSS защита на уровне API)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Хакер",
      email: "h@mail.ru",
      subject: "XSS тест для проверки",
      message: "<script>alert('xss')</script> это попытка взлома",
    });
    // Zod только валидирует, sanitize происходит на уровне API
    expect(result.success).toBe(true);
  });

  // Edge case — имя только из пробелов (после trim становится пустым)
  it("отклоняет имя из одних пробелов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "   ",
      email: "user@mail.ru",
      subject: "Тема сообщения",
      message: "Достаточно длинное сообщение для теста.",
    });
    // После trim → "" → не проходит min(2)
    expect(result.success).toBe(false);
  });

  // Edge case — email с субдоменом
  it("принимает email с субдоменом (user@sub.example.com)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "user@sub.example.com",
      subject: "Тема сообщения здесь",
      message: "Достаточно длинное сообщение для теста проверки.",
    });
    expect(result.success).toBe(true);
  });

  // Edge case — имя ровно 100 символов (максимум)
  it("принимает имя ровно 100 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "А".repeat(100),
      email: "user@mail.ru",
      subject: "Тема сообщения здесь",
      message: "Достаточно длинное сообщение для теста проверки.",
    });
    expect(result.success).toBe(true);
  });

  // Edge case — имя 101 символ (больше максимума)
  it("отклоняет имя из 101 символа", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "А".repeat(101),
      email: "user@mail.ru",
      subject: "Тема сообщения здесь",
      message: "Достаточно длинное сообщение для теста проверки.",
    });
    expect(result.success).toBe(false);
  });
});
