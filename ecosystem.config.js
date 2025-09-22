module.exports = {
  apps: [{
    name: 'slyos-proxy-api',
    script: './server.js',
    env: {
      PORT: 8787,
      ORIGIN: 'slyos-site-pjpmx9sg5-beltos-projects.vercel.app',
      BYPASS_TOKEN: '12121212121212121212121212121212',
      MONGODB_URI: 'mongodb+srv://belto_user:1xreNzfGsivHvGDB@cluster0.biyfimo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      MONGODB_DB: 'slyos'
    }
  }]
};
