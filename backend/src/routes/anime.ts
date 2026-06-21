import { Router } from 'express';

export const animeRouter = Router();

interface AniListMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    medium: string;
    color: string | null;
  };
  averageScore: number | null;
  episodes: number | null;
  nextAiringEpisode: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  genres: string[];
}

interface AniListResponse {
  data?: {
    Page?: {
      media?: AniListMedia[];
    };
  };
}

function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month === 11) return { season: 'WINTER', year: year + 1 };
  if (month <= 1) return { season: 'WINTER', year };
  if (month <= 4) return { season: 'SPRING', year };
  if (month <= 7) return { season: 'SUMMER', year };
  return { season: 'FALL', year };
}

animeRouter.get('/', async (_req, res) => {
  try {
    const { season, year } = getCurrentSeason();

    const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, format: TV, season: ${season}, seasonYear: ${year}, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { medium color }
            averageScore
            episodes
            nextAiringEpisode { airingAt timeUntilAiring episode }
            genres
          }
        }
      }
    `;

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      res.status(502).json({ error: 'AniList API unavailable' });
      return;
    }

    const json = (await response.json()) as AniListResponse;
    const mediaList = json.data?.Page?.media ?? [];

    const anime = mediaList.map((item) => ({
      title: item.title.english || item.title.romaji,
      score: item.averageScore ?? 0,
      episodes: item.episodes ?? 0,
      nextEpisode: item.nextAiringEpisode?.episode ?? null,
      airingAt: item.nextAiringEpisode
        ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString()
        : null,
      timeUntilAiring: item.nextAiringEpisode?.timeUntilAiring ?? null,
      genres: item.genres.slice(0, 4),
      coverColor: item.coverImage.color ?? null,
    }));

    res.json({ anime });
  } catch {
    res.status(502).json({ error: 'AniList API unavailable' });
  }
});
