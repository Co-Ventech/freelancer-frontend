import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const openai_client = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
});

// === Load the email template ===
const templatePath = path.resolve("templates/email_templates.json");
let universalTemplate = "";

try {
    const data = JSON.parse(fs.readFileSync(templatePath, "utf-8"));
    universalTemplate = data.freelancer_template?.base_structure || "";
} catch (error) {
    console.error("❌ Missing or invalid email_templates.json:", error);
    process.exit(1);
}

if (!universalTemplate) {
    throw new Error("❌ Missing base_structure inside freelancer_template in email_templates.json");
}

// === Function to generate proposal ===
export async function generateProposal(title, description) {
    const prompt = `
You are a professional freelancer crafting proposals for clients on Freelancer.com.

Follow this exact structure and tone. DO NOT alter the structure, tone, or link formatting.
You can only change:
- The first few lines (problem-solving + skill alignment) to match the client’s job.
- The technical skills mentioned, to reflect what’s most relevant to the job description.

Keep the rest — links, closing lines, tone, and phrasing — exactly the same.

REFERENCE EXAMPLE (follow this same pattern):
${universalTemplate}

Now, using that as a pattern, write a proposal for:
Job Title: ${title}
Job Description: ${description}

Follow these exact rules:
- Start with “Hey, how are you?” or “Hi, how are you?”
- Second line: Start with "Although I am new to freelancer, I have over 5 years of experience in [client's related domain/skill/issue]", and express confidence in solving the client’s main issue.
- Third and fourth lines: briefly explain your relevant experience and skills (align with job).
- Include this section exactly:
  You can review a few of my past work:
  https://app.recruitinn.ai
  https://skillbuilder.online
  https://co-ventech.com
  https://app.co-ventech.com
  https://www.starmarketingonline.com/
  https://teamwear.design/
  https://visanetic.com/
  https://drivefds.com/
  https://gfsbuilders.com.pk/
  https://bachatt.com/
- End with a polite closing similar to: “Looking forward to hearing more about your vision...” and “Thank you. [Name].”
`;

    try {
        const response = await openai_client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert in writing natural, confident, and human-like Freelancer proposals.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("❌ Error generating proposal:", error);
        return "Error generating proposal.";
    }
}

