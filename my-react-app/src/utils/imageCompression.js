/**
 * Mengompresi file gambar menggunakan HTML5 Canvas sebelum diunggah.
 * @param {File} file - Berkas gambar asli yang dipilih pengguna
 * @param {number} maxWidth - Batas lebar maksimum (default 1280px)
 * @param {number} maxHeight - Batas tinggi maksimum (default 1280px)
 * @param {number} quality - Kualitas kompresi JPEG (0.0 sampai 1.0, default 0.7)
 * @returns {Promise<File>} Berkas file baru yang ukurannya sudah dikompresi
 */
export async function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) {
  // Hanya proses jika file adalah gambar (jpeg, png, webp, dll)
  if (!file || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung rasio aspek baru jika melebihi batas maksimum
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        
        // Pilihan untuk kualitas rendering lebih halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Gambarkan ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor canvas ke blob berformat JPEG untuk menekan ukuran file
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompres gambar, canvas mereturn null."));
              return;
            }
            // Buat File baru dengan nama asli pengguna
            const compressedFile = new File([blob], file.name || "compressed_image.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (error) => {
        reject(error);
      };
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
}
