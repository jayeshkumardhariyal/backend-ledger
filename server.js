require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
