const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
//dotenv.config();
const port = process.env.PORT || 1338;
dotenv.config({ path: "../config.env" });
const app = express();
const path = require("path");

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  //res.header('Access-Control-Allow-Origin', 'https://digital-card.kokosan96.repl.co'); // Permite accesul doar de la originea specificată
  res.header('Access-Control-Allow-Origin','https://a9acdbf9-c13c-47ee-b9a6-6e914ea563d5-00-1ro96kwzluipq.spock.replit.dev')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH'); // Metodele HTTP permise
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Antetele permise
  next();
});

const users = require("./routes/api/users");

app.use("/api/users", users);

app.listen(9000, function () {
  console.log("App listening on", 9000);
});

