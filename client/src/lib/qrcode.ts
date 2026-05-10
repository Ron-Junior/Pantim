import QRCode from 'qrcode';

export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export function getPlayerJoinURL(serverIP: string, serverPort: number): string {
  return `http://${serverIP}:${serverPort}/player`;
}
