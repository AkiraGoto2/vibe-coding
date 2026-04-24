/**
 * Тесты для функций авторизации и валидации
 * Инструмент: Vitest
 * Покрытие: нормальный ввод, граничные значения, ошибочный ввод, edge cases
 */

import { describe, it, expect } from "vitest";

// ── ТЕСТ 1: registerSchema — полная валидация регистрации ─────────────────────

describe("registerSchema — валидация формы регистрации", () => {

  const getSchema = async () => {
    const { registerSchema } = await import("../lib/validations");
    return registerSchema;
  };

  // Нормальный ввод
  it("принимает корректные данные регистрации", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван Петров",
      email: "ivan@example.com",
      password: "SecretPass1",
      confirmPassword: "SecretPass1",
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — имя минимальной длины (2 символа)
  it("принимает имя ровно из 2 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Ян",
      email: "yan@mail.ru",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — имя из 1 символа (меньше минимума)
  it("отклоняет имя из 1 символа", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Я",
      email: "ya@mail.ru",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — нет заглавной буквы в пароле
  it("отклоняет пароль без заглавной буквы", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alex@mail.ru",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("uppercase");
  });

  // Ошибочный ввод — нет цифры в пароле
  it("отклоняет пароль без цифры", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alex@mail.ru",
      password: "PasswordOnly",
      confirmPassword: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });

  // Edge case — пароли не совпадают
  it("отклоняет несовпадающие пароли", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alex@mail.ru",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].path).toContain("confirmPassword");
  });

  // Edge case — email приводится к нижнему регистру
  it("нормализует email к нижнему регистру", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "ALEX@MAIL.RU",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("alex@mail.ru");
  });

  // Граничное значение — пароль ровно 8 символов (минимум)
  it("принимает пароль ровно 8 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alex@mail.ru",
      password: "Passw0rd",
      confirmPassword: "Passw0rd",
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — пароль 7 символов (меньше минимума)
  it("отклоняет пароль из 7 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alex@mail.ru",
      password: "Pass1Ab",
      confirmPassword: "Pass1Ab",
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — невалидный email
  it("отклоняет email без знака @", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Алекс",
      email: "alexmail.ru",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(false);
  });

  // Граничное значение — пустое имя
  it("отклоняет пустое имя", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "",
      email: "alex@mail.ru",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(false);
  });
});

// ── ТЕСТ 2: verifyEmailSchema — валидация OTP кода ────────────────────────────

describe("verifyEmailSchema — валидация OTP кода подтверждения email", () => {

  const getSchema = async () => {
    const { verifyEmailSchema } = await import("../lib/validations");
    return verifyEmailSchema;
  };

  // Нормальный ввод
  it("принимает корректный 6-значный код", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "123456" });
    expect(result.success).toBe(true);
  });

  // Граничное значение — код из нулей
  it("принимает код из 000000 (граничное нулевое значение)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "000000" });
    expect(result.success).toBe(true);
  });

  // Граничное значение — код из 999999
  it("принимает максимальный код 999999", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "999999" });
    expect(result.success).toBe(true);
  });

  // Ошибочный ввод — 5 цифр вместо 6
  it("отклоняет код из 5 цифр", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "12345" });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — 7 цифр вместо 6
  it("отклоняет код из 7 цифр", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "1234567" });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — буквы вместо цифр
  it("отклоняет код с буквами", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "12345X" });
    expect(result.success).toBe(false);
  });

  // Edge case — пустая строка
  it("отклоняет пустую строку в поле кода", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: "" });
    expect(result.success).toBe(false);
  });

  // Edge case — пробелы вокруг кода
  it("отклоняет код с пробелами (не обрезает)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ email: "user@mail.ru", code: " 12345" });
    expect(result.success).toBe(false);
  });
});

// ── ТЕСТ 3: settingsSchema — валидация настроек таймера ───────────────────────

describe("settingsSchema — валидация настроек таймера", () => {

  const getSchema = async () => {
    const { settingsSchema } = await import("../lib/validations");
    return settingsSchema;
  };

  // Нормальный ввод
  it("принимает стандартные настройки (25/5 мин)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 25,
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — минимальное время работы (5 мин)
  it("принимает минимальное время работы 5 минут", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 5,
      breakDuration: 5,
      language: "ru",
      autostart: false,
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — ниже минимума (4 мин)
  it("отклоняет время работы 4 минуты (ниже минимума)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 4,
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(false);
  });

  // Граничное значение — максимальное время работы (180 мин)
  it("принимает максимальное время работы 180 минут", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 180,
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — выше максимума (181 мин)
  it("отклоняет время работы 181 минуту (выше максимума)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 181,
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — дробное число
  it("отклоняет дробное значение времени работы", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 25.5,
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — строка вместо числа
  it("отклоняет строку вместо числа", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: "двадцать пять",
      breakDuration: 5,
      language: "en",
      autostart: false,
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — неизвестный язык
  it("отклоняет неподдерживаемый язык 'fr'", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      workDuration: 25,
      breakDuration: 5,
      language: "fr",
      autostart: false,
    });
    expect(result.success).toBe(false);
  });

  // Edge case — оба поддерживаемых языка корректны
  it("принимает язык 'en'", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ workDuration: 25, breakDuration: 5, language: "en", autostart: true });
    expect(result.success).toBe(true);
  });

  it("принимает язык 'ru'", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({ workDuration: 25, breakDuration: 5, language: "ru", autostart: false });
    expect(result.success).toBe(true);
  });
});

// ── ТЕСТ 4: feedbackSchema — валидация формы обратной связи ───────────────────

describe("feedbackSchema — валидация формы обратной связи", () => {

  const getSchema = async () => {
    const { feedbackSchema } = await import("../lib/validations");
    return feedbackSchema;
  };

  // Нормальный ввод
  it("принимает корректное сообщение обратной связи", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "Ошибка приложения",
      message: "При нажатии на кнопку паузы приложение зависает.",
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — сообщение ровно 10 символов (минимум)
  it("принимает сообщение ровно из 10 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "Тема",
      message: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — сообщение из 9 символов (меньше минимума)
  it("отклоняет сообщение из 9 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "Тема",
      message: "123456789",
    });
    expect(result.success).toBe(false);
  });

  // Граничное значение — сообщение ровно 2000 символов (максимум)
  it("принимает сообщение ровно 2000 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "Тема",
      message: "а".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — сообщение 2001 символ (больше максимума)
  it("отклоняет сообщение из 2001 символа", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "Тема",
      message: "а".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — пустая тема
  it("отклоняет пустую тему сообщения", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "",
      message: "Длинное сообщение здесь",
    });
    expect(result.success).toBe(false);
  });

  // Ошибочный ввод — тема слишком короткая (2 символа, минимум 3)
  it("отклоняет тему из 2 символов (минимум 3)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Иван",
      email: "ivan@mail.ru",
      subject: "ОК",
      message: "Длинное сообщение здесь",
    });
    expect(result.success).toBe(false);
  });

  // Edge case — пробелы обрезаются trim
  it("обрезает пробелы в имени через trim", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "  Иван  ",
      email: "ivan@mail.ru",
      subject: "Тема запроса",
      message: "Достаточно длинное сообщение для теста.",
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Иван");
  });
});

// ── ТЕСТ 5: exerciseAdminSchema — валидация данных упражнения ─────────────────

describe("exerciseAdminSchema — валидация данных упражнения (для администратора)", () => {

  const getSchema = async () => {
    const { exerciseAdminSchema } = await import("../lib/validations");
    return exerciseAdminSchema;
  };

  // Нормальный ввод
  it("принимает корректные данные упражнения", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Neck Rolls",
      description: "Slowly roll your head in circles to relieve neck tension.",
      gifUrl: "https://media.giphy.com/media/example/giphy.gif",
      category: "stretch",
      duration: 45,
    });
    expect(result.success).toBe(true);
  });

  // Нормальный ввод — все 4 категории корректны
  it("принимает категорию 'strength'", async () => {
    const schema = await getSchema();
    const r = schema.safeParse({ name: "Squats", description: "Stand and squat slowly near your desk.", gifUrl: "https://example.com/a.gif", category: "strength", duration: 60 });
    expect(r.success).toBe(true);
  });

  it("принимает категорию 'cardio'", async () => {
    const schema = await getSchema();
    const r = schema.safeParse({ name: "Marching", description: "March in place for 30 seconds non-stop.", gifUrl: "https://example.com/b.gif", category: "cardio", duration: 30 });
    expect(r.success).toBe(true);
  });

  it("принимает категорию 'relax'", async () => {
    const schema = await getSchema();
    const r = schema.safeParse({ name: "Breathing", description: "Box breathing exercise for stress relief.", gifUrl: "https://example.com/c.gif", category: "relax", duration: 30 });
    expect(r.success).toBe(true);
  });

  // Ошибочный ввод — неизвестная категория
  it("отклоняет неизвестную категорию 'yoga'", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Yoga Pose",
      description: "Some kind of yoga exercise for the body.",
      gifUrl: "https://example.com/yoga.gif",
      category: "yoga",
      duration: 45,
    });
    expect(result.success).toBe(false);
  });

  // Граничное значение — длительность минимум 10 сек
  it("принимает минимальную длительность 10 секунд", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Quick Stretch",
      description: "A very quick stretch for the wrists and fingers.",
      gifUrl: "https://example.com/quick.gif",
      category: "stretch",
      duration: 10,
    });
    expect(result.success).toBe(true);
  });

  // Граничное значение — длительность 9 сек (меньше минимума)
  it("отклоняет длительность 9 секунд (меньше минимума)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Too Short",
      description: "This exercise is too short to be useful here.",
      gifUrl: "https://example.com/short.gif",
      category: "stretch",
      duration: 9,
    });
    expect(result.success).toBe(false);
  });

  // Граничное значение — длительность 300 сек (максимум)
  it("принимает максимальную длительность 300 секунд", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Long Meditation",
      description: "A long meditation exercise for deep relaxation.",
      gifUrl: "https://example.com/med.gif",
      category: "relax",
      duration: 300,
    });
    expect(result.success).toBe(true);
  });

  // Ошибочный ввод — невалидный URL гифки
  it("отклоняет невалидный URL гифки", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Neck Rolls",
      description: "Slowly roll your head in circles to relieve tension.",
      gifUrl: "не-url",
      category: "stretch",
      duration: 45,
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("valid URL");
  });

  // Ошибочный ввод — описание слишком короткое (меньше 10 символов)
  it("отклоняет описание короче 10 символов", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Neck Rolls",
      description: "Коротко",
      gifUrl: "https://example.com/neck.gif",
      category: "stretch",
      duration: 45,
    });
    expect(result.success).toBe(false);
  });

  // Edge case — дробная длительность
  it("отклоняет дробную длительность (45.5 сек)", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Neck Rolls",
      description: "Slowly roll your head in circles to relieve tension.",
      gifUrl: "https://example.com/neck.gif",
      category: "stretch",
      duration: 45.5,
    });
    expect(result.success).toBe(false);
  });

  // Edge case — isActive по умолчанию true
  it("устанавливает isActive = true по умолчанию если не указан", async () => {
    const schema = await getSchema();
    const result = schema.safeParse({
      name: "Neck Rolls",
      description: "Slowly roll your head in circles to relieve tension.",
      gifUrl: "https://example.com/neck.gif",
      category: "stretch",
      duration: 45,
    });
    expect(result.success).toBe(true);
    expect(result.data?.isActive).toBe(true);
  });
});
