const DEFAULT_HOST = import.meta.env.VITE_SERVER_HOST || 'http://localhost';
const DEFAULT_PORT = import.meta.env.VITE_SERVER_PORT || '3000';

interface ServerInfo {
  ip: string;
  port: number;
  timestamp: string;
}

export async function getServerInfo(): Promise<ServerInfo> {
  const url = `${DEFAULT_HOST}:${DEFAULT_PORT}`;
  
  try {
    const response = await fetch(`${url}/api/server-info`);
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip,
        port: data.port,
        timestamp: data.timestamp,
      };
    }
  } catch (error) {
    console.warn('Failed to get server info, using defaults:', error);
  }

  return {
    ip: DEFAULT_HOST.replace('http://', '').replace('https://', ''),
    port: parseInt(DEFAULT_PORT, 10),
    timestamp: new Date().toISOString(),
  };
}

export function getServerConfig() {
  return {
    host: DEFAULT_HOST,
    port: parseInt(DEFAULT_PORT, 10),
  };
}
