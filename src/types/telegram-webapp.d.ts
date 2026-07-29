/** Telegram Mini App JS SDK'sının kullandığımız kısmı — bkz. https://telegram.org/js/telegram-web-app.js */
export interface TelegramWebApp {
  initData: string;
  version?: string;
  platform?: string;
  ready(): void;
  expand(): void;
  close(): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
