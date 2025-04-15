const express = require("express");
const app = express();

// Yeh line fix hai:
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
