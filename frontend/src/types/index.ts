export interface SystemData {
  cpuTemp: number;
  cpuUsage: number;
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  uptime: number;
  loadAvg: [number, number, number];
}

export interface VpnStatus {
  name: string;
  label: string;
  connected: boolean;
  ip: string | null;
  uptime: number | null;
}

export interface VpnData {
  vpns: VpnStatus[];
  externalIp: string | null;
}

export interface Torrent {
  name: string;
  size: number;
  progress: number;
  downloadSpeed: number;
  state: string;
  eta: number;
}

export interface TorrentsData {
  total: number;
  downloading: number;
  seeding: number;
  totalDownloadSpeed: number;
  totalUploadSpeed: number;
  torrents: Torrent[];
}

export interface TailscalePeer {
  name: string;
  ip: string;
  online: boolean;
  lastSeen: string;
}

export interface TailscaleData {
  self: {
    name: string;
    ip: string;
    online: boolean;
  };
  peers: TailscalePeer[];
  onlineCount: number;
  totalCount: number;
}

export interface WeatherForecast {
  date: string;
  max: number;
  min: number;
  description: string;
  icon: string;
}

export interface CityWeather {
  name: string;
  current: {
    temp: number;
    humidity: number;
    description: string;
    icon: string;
    windSpeed: number;
  };
  forecast: WeatherForecast[];
}

export interface WeatherData {
  cities: CityWeather[];
}

export interface AnimeItem {
  title: string;
  score: number;
  episodes: number;
  nextEpisode: number | null;
  airingAt: string | null;
  timeUntilAiring: number | null;
  genres: string[];
  coverColor: string | null;
}

export interface AnimeData {
  anime: AnimeItem[];
}
