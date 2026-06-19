import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://martialgrid.com'; // Replace with your domain

  // 1. Static Routes
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/onboarding`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 }, // Assuming community is public
    { url: `${baseUrl}/pulse`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 }, // Live scoring is always changing
  ] as MetadataRoute.Sitemap;

  // 2. Dynamic Tournament Routes
  // Fetch all public/approved tournaments to feed to the search engines
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, created_at')
    .eq('registration_mode', 'open'); // Only index public ones

  const dynamicRoutes = (tournaments || []).map((tournament) => ({
    url: `${baseUrl}/tournament/${tournament.id}`,
    lastModified: new Date(tournament.created_at),
    changeFrequency: 'daily',
    priority: 0.8,
  })) as MetadataRoute.Sitemap;

  return [...staticRoutes, ...dynamicRoutes];
}