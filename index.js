const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // 👈 VERY IMPORTANT
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from backend');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
