import React from 'react';
import { useApi } from '../hooks/useApi';
import type { AnimeData } from '../types';
import Widget from './Widget';

function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'Aired';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AnimeWidget() {
  const { data, isLoading, error } = useApi<AnimeData>('/api/anime', 300000);

  return (
    <Widget title="Anime This Season" icon="🎬" isLoading={isLoading} error={error}>
      {data && (
        <div className="space-y-2">
          {data.anime.slice(0, 5).map((anime, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-lg bg-gray-700/40 hover:bg-gray-700/60 transition-colors"
            >
              <div
                className="w-2 h-full min-h-[2.5rem] rounded-full flex-shrink-0"
                style={{ backgroundColor: anime.coverColor || '#4b5563' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {anime.title}
                  </span>
                  {anime.score > 0 && (
                    <span className="text-xs text-yellow-400 font-mono flex-shrink-0">
                      ★ {anime.score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {anime.nextEpisode !== null && (
                    <span className="text-xs text-blue-400">
                      EP {anime.nextEpisode} in {formatCountdown(anime.timeUntilAiring)}
                    </span>
                  )}
                  {anime.nextEpisode === null && (
                    <span className="text-xs text-gray-500">
                      {anime.episodes > 0 ? `${anime.episodes} eps` : 'TBA'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600/50 text-gray-400"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}
