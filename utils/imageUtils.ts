/**
 * Resizes an image to a maximum width or height, maintaining aspect ratio.
 * Returns the resized image as a base64 string (without the data URL prefix).
 */
export const resizeImage = (file: File, maxWidth = 1500, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                // Return base64 string without prefix
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
