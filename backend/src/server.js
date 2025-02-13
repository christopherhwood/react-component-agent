if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env.local' });
} else {
  require('dotenv').config({ path: './.env.production' });
}

const { connectDB } = require('./services/db');

(async () => {
  await connectDB();
  const app = require('./app');
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
