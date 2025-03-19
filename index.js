const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const supabase = require("./db");
const userRoute = require("./routes/userRoutes");
const busRoute = require("./routes/busRoutes");

dotenv.config();

const app = express();

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

// Test the connection when the app starts (using Supabase)
async function testConnection() {
  try {
    const { data, error } = await supabase.from("users").select("*");
    console.log("data", data);

    if (error) {
      console.error("Database connection error:", error.message);
    } else {
      console.log("Database connection successful:", data);
    }
  } catch (err) {
    console.error("Database connection error:", err.message);
  }
}

testConnection();

app.use("/api/users", userRoute);

app.use("/api", busRoute);

app.use("/", (req, res) => {
  res.send("Server is running successfully!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
