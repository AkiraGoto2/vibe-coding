import { z } from "zod";

const emailField = z
  .string({ required_error: "Email is required" })
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(254, "Email too long")
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long") // bcrypt truncates at 72
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50).trim(),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: emailField,
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
});

export const resendCodeSchema = z.object({
  email: emailField,
});

export const feedbackSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: emailField,
  subject: z.string().min(3).max(200).trim(),
  message: z.string().min(10).max(2000).trim(),
});

export const settingsSchema = z.object({
  workDuration: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(5, "Minimum 5 minutes")
    .max(180, "Maximum 180 minutes"),
  breakDuration: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, "Minimum 1 minute")
    .max(60, "Maximum 60 minutes"),
  language: z.enum(["en", "ru"]),
  autostart: z.boolean(),
});

export const exerciseAdminSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  nameRu: z.string().max(100).trim().optional().default(""),
  description: z.string().min(10).max(500).trim(),
  descriptionRu: z.string().max(500).trim().optional().default(""),
  gifUrl: z.string().url("Must be a valid URL").max(500),
  category: z.enum(["stretch", "strength", "cardio", "relax"]),
  duration: z.number().int().min(10).max(300),
  isActive: z.boolean().optional().default(true),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ExerciseAdminInput = z.infer<typeof exerciseAdminSchema>;
