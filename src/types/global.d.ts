declare global {
  interface Window {
    google: typeof google;
  }
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

export {};
