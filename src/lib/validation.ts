import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  businessName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(100).optional(),
  language: z.enum(['en', 'he']).default('en'),
  timezone: z.string().max(100).default('Asia/Jerusalem'),
});

export const generateDraftsSchema = z.object({
  brandId: z.string(),
  mediaId: z.string(),
  format: z.enum(['story', 'post', 'reel']),
  platforms: z.array(z.enum(['instagram', 'facebook', 'tiktok'])).min(1),
  customPrompt: z.string().max(500).optional(),
});

export const publishSchema = z.object({
  draftId: z.string(),
  scheduledFor: z.string().datetime().optional(),
});
