require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB Connected"));

const userSchema = new mongoose.Schema({
  userId: String,
  wallet: Object,
  pin: String
});

const User = mongoose.model("User", userSchema);

app.post("/create", async (req, res) => {
  const { userId, pin } = req.body;

  const exists = await User.findOne({ userId });
  if (exists) return res.json({ msg: "Wallet exists" });

  const wallet = ethers.Wallet.createRandom();

  await User.create({
    userId,
    wallet: {
      address: wallet.address,
      privateKey: wallet.privateKey
    },
    pin: await bcrypt.hash(pin, 10)
  });

  res.json({ address: wallet.address });
});

app.get("/balance/:userId", async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  if (!user) return res.json({ msg: "No wallet" });

  const provider = new ethers.JsonRpcProvider(process.env.RPC);
  const bal = await provider.getBalance(user.wallet.address);

  res.json({ balance: ethers.formatEther(bal) });
});

app.listen(3000, () => console.log("API running"));
