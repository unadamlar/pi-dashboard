import React from 'react';
import Layout from './components/Layout';
import SystemWidget from './components/SystemWidget';
import VpnWidget from './components/VpnWidget';
import TorrentWidget from './components/TorrentWidget';
import TailscaleWidget from './components/TailscaleWidget';
import WeatherWidget from './components/WeatherWidget';
import AnimeWidget from './components/AnimeWidget';
import QuickLinksWidget from './components/QuickLinksWidget';

export default function App() {
  return (
    <Layout>
      <SystemWidget />
      <VpnWidget />
      <WeatherWidget />
      <TorrentWidget />
      <TailscaleWidget />
      <AnimeWidget />
      <div className="md:col-span-2 xl:col-span-3">
        <QuickLinksWidget />
      </div>
    </Layout>
  );
}
