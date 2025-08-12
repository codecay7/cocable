export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.body.appendChild(script);
  });
};