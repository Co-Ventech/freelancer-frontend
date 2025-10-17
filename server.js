import express from "express";
import dotenv from "dotenv";
import { generateProposal } from "./openai/proposalGenerator.js";

dotenv.config();

const app = express();
app.use(express.json());

// === POST route to generate proposal ===
app.post("/generate-proposal", async (req, res) => {
  const { id, title, description} = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description." });
  }

  console.log(`🟢 Generating proposal for: ${title}`);

  const proposalText = await generateProposal(title, description);

  res.json({
    id: id || null,
    title,
    description,
    proposal: proposalText,
  });
});

// === Start the server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Freelancer Proposal API running on port ${PORT}`)
);
