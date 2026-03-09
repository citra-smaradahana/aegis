// cropImageUtil.js
export default function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');

      // Jika crop menggunakan persentase, konversi ke pixel
      let cropX, cropY, cropWidth, cropHeight;

      if (crop.width <= 1) {
        // Persentase (0-1)
        cropX = Math.round(image.width * crop.x);
        cropY = Math.round(image.height * crop.y);
        cropWidth = Math.round(image.width * crop.width);
        cropHeight = Math.round(image.height * crop.height);
      } else if (crop.width <= 100) {
        // Persentase (0-100)
        cropX = Math.round((image.width * crop.x) / 100);
        cropY = Math.round((image.height * crop.y) / 100);
        cropWidth = Math.round((image.width * crop.width) / 100);
        cropHeight = Math.round((image.height * crop.height) / 100);
      } else {
        // Pixel
        cropX = crop.x;
        cropY = crop.y;
        cropWidth = crop.width;
        cropHeight = crop.height;
      }

      // Pastikan crop area tidak melebihi ukuran gambar
      cropX = Math.max(0, Math.min(cropX, image.width));
      cropY = Math.max(0, Math.min(cropY, image.height));
      cropWidth = Math.min(cropWidth, image.width - cropX);
      cropHeight = Math.min(cropHeight, image.height - cropY);

      // Pastikan crop area minimal 1x1 pixel
      if (cropWidth <= 0 || cropHeight <= 0) {
        reject(new Error('Invalid crop area'));
        return;
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');

      try {
        ctx.drawImage(
          image,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        reject(new Error(`Failed to draw image: ${error.message}`));
      }
    };
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}
