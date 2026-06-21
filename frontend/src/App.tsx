import React from 'react';
import Layout from './components/Layout';
import SystemWidget from './components/SystemWidget';
import VpnWidget from './components/VpnWidget';
import TorrentWidget from './components/TorrentWidget';
import TailscaleWidget from './components/TailscaleWidget';
import WeatherWidget from './components/WeatherWidget';

export default function App() {
  return (
    <Layout>
      <SystemWidget />
      <VpnWidget />
      <TorrentWidget />
      <TailscaleWidget />
      <WeatherWidget />
    </Layout>
  );
}
