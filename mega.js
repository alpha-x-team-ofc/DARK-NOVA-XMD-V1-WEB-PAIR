const mega = require("megajs");

// Secure way to handle credentials (should use environment variables)
const auth = {
  email: process.env.MEGA_EMAIL || "rorayeg492@aravites.com",
  password: process.env.MEGA_PASSWORD || "dulina2011@##dn",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"
};

const upload = (data, name) => {
  return new Promise((resolve, reject) => {
    const storage = new mega.Storage(auth, (err) => {
      if (err) return reject(err);
      
      const uploadStream = storage.upload({
        name: name,
        allowUploadBuffering: true
      });

      uploadStream.on("complete", (file) => {
        file.link((err, url) => {
          storage.close();
          if (err) return reject(err);
          resolve(url);
        });
      });

      uploadStream.on("error", reject);
      
      if (typeof data.pipe === 'function') {
        data.pipe(uploadStream);
      } else {
        uploadStream.end(data);
      }
    });

    storage.on("error", reject);
  });
};

module.exports = { upload };
