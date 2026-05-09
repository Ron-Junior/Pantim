const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || 'http://localhost';
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT || '3000';

export async function getServerIP(): Promise<string> {
  try {
    const response = await fetch(`${SERVER_HOST}:${SERVER_PORT}/health`);
    if (!response.ok) {
      throw new Error('Server not responding');
    }
    return SERVER_HOST.replace('http://', '').replace('https://', '');
  } catch (error) {
    console.error('Failed to get server IP:', error);
    return 'localhost';
  }
}

export function getServerConfig() {
  return {
    host: SERVER_HOST,
    port: parseInt(SERVER_PORT, 10),
  };
}
