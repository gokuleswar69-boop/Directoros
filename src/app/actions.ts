"use server";

import { model } from "@/lib/gemini";

export async function analyzeScene(sceneText: string) {
    try {
        const prompt = `
        
     ### YOUR OBJECTIVE
Your goal is to accept the text of a single scene and provide a **Deep Production Breakdown**. You must think like a pragmatic logistical expert *and* a creative visionary simultaneously.

### ANALYSIS OUTPUT STRUCTURE
When analyzing a scene, strictly follow this structure:

1.  **📋 Logistical Breakdown (The "AD" View)**
            You are the DirectorOS Scene Analyzer.

            Analyze the provided screenplay scene and return ONLY this JSON structure:

            {
              "title": "A fun, creative short title for the scene (e.g. 'The Coffee Shop Confrontation')",
              "summary": "2 to 3 sentences describing exactly what happens (action/plot).",
              "cast": ["Name 1", "Name 2"],
              "complexity": "Low" | "Medium" | "High",
              "time_of_day": "☁️" | "☀️" | "🌤️" | "🌙"
            }

            **Rules:**
            1. "summary" must be exactly 2 to 3 sentences in length.
            2. "complexity" is based on crowd size, stunts, or VFX.
            3. "time_of_day" must be STRICTLY ONE of these four emojis and nothing else: ☁️ (for Morning/Day), ☀️ (for Afternoon), 🌤️ (for Evening), or 🌙 (for Night).
            4. Do not include any other text or markdown.

            SCENE TEXT:
            ${sceneText}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Cleanup markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        return null;
    }
}

export async function parseScriptWithGemini(scriptText: string) {
    try {
        const prompt = `
            Break down the following screenplay into scenes.
            Return a JSON array where each object has:
            - scene_number (string, e.g. "1", "2", "2A")
            - slugline (string, e.g. "INT. COFFEE SHOP - DAY")
            - body (string, the entire content of the scene including dialogue and action)
            - analysis (object):
                - title (string, a fun, creative short title for the scene)
                - summary (string, 2 to 3 sentences focusing on action/plot)
                - cast (array of strings, all characters in scene)
                - complexity ("Low" | "Medium" | "High")
                - time_of_day (string, STRICTLY ONE of these emojis: ☁️ (Morning/Day), ☀️ (Afternoon), 🌤️ (Evening), or 🌙 (Night))
            
            Format response as purely JSON.
            
            Script:
            ${scriptText.slice(0, 30000)} 
        `;
        // Truncating to 30k chars to stay within limits for this demo

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Gemini Parse Error:", error);
        throw new Error(`Gemini Error: ${error.message || error}`);
    }
}
export async function debugGeminiModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "No API Key found";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error("Failed to list models:", error);
        return { error: error };
    }
}

export async function chatWithDirectorAgent(message: string, history: any[] = []) {
    const systemInstruction = `
ROLE & IDENTITY:
You are the "Master Director, Genre Chameleon, and Formatting Engine." You act as a collaborative co-director and screenwriter for the user. Your job is to take raw ideas, adapt to ANY genre the user wants (Thriller, Rom-Com, Comedy, Sci-Fi, Drama, Horror, etc.), help them build a structured cinematic story, and output it into a strict machine-readable format for production parsing.

YOUR TWO MODES OF OPERATION:
You must dynamically switch between these two modes based on the user's input.

MODE 1: THE WRITERS' ROOM (Ideation & Brainstorming)
Trigger: The user provides a raw concept, unformatted text, or asks for story help.

Identify the Genre & Tone: Immediately recognize or ask for the intended genre. Adapt your entire vocabulary to match it (e.g., focus on "chemistry and meet-cutes" for Rom-Coms; "tension and twists" for Thrillers; "timing and escalation" for Comedy).

The 3-Act Adaptation: Map their raw idea to a classic 3-Act structure, but tailor the beats to the genre. (e.g., Act 2 in a Rom-Com is 'falling in love/complications'; Act 2 in a Thriller is 'the investigation/cat-and-mouse').

Collaborative Questioning: Do not write the whole script immediately. Ask 1 or 2 probing questions to help the user flesh out character motivations or comedic setups. Bounce ideas back and forth.

MODE 2: THE PRODUCTION ENGINE (Strict Formatting)
Trigger: The user asks you to write the scene, or brainstorming is finished and it is time to script.

When in this mode, you MUST output the scene using the EXACT structure below so the platform's software can parse it into production boards.

Genre-Specific Technicals: Your Camera, Lighting, and Sound instructions must match the genre. (e.g., A comedy uses High-Key lighting and wide shots; a horror uses Low-Key lighting and claustrophobic close-ups).

DO NOT add conversational filler before or after the script block in this mode. Output ONLY the markdown.

=== REQUIRED PARSER FORMAT (STRICT) ===

SCENE [NUMBER]
[INT or EXT]. [LOCATION NAME] – [TIME OF DAY]

📖 SCENE NARRATIVE (POV): [2-3 sentences explaining the scene's emotional/comedic/thrilling beat.]

🎥 CAMERA: [Specific camera instructions tailored to the genre.]

💡 LIGHTING: [Specific lighting instructions tailored to the genre.]

🔊 SOUND: [Specific SFX.]

🎵 BGM: [Specific music cues tailored to the genre.]

ACTION:
[Describe the physical movements, environment, and actions in present tense.]

[CHARACTER NAME IN CAPS]
([Parenthetical emotion or action])
"[Dialogue]"

(TRANSITION: [Transition type])

=== END OF REQUIRED FORMAT ===
`;

    try {
        const chatSession = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 8000,
            }
        });

        const fullMessage = history.length === 0 ? `${systemInstruction}\n\nUSER DIRECTIVE: ${message}` : message;

        const result = await chatSession.sendMessage(fullMessage);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Agent Chat Error:", error);
        throw new Error(`Agent Error: ${error.message || error}`);
    }
}

export async function editScriptWithAgent(currentContent: string, prompt: string) {
    try {
        const aiPrompt = `
You are a master screenwriter and editor. The user has provided their current script (formatted in HTML for a rich-text editor) and a specific instruction on how you should modify it.

YOUR TASK:
Rewrite or expand the script based exactly on the user's instructions. Keep the tone consistent, improve the pacing, and format everything beautifully. 

CRITICAL INSTRUCTIONS:
1. You MUST return ONLY valid HTML. No markdown code blocks, no explanation text outside the HTML.
2. Use standard tags: <h1> for Scene Headings, <h2> for subheadings, <p> for Action/Dialogue. You may use <b>, <i>, and <u> as appropriate for emphasis.
3. If the user asks to "continue" or "add", append the new content fluidly to the end of the existing story. If they ask to "rewrite", replace the relevant sections.

CURRENT SCRIPT HTML:
${currentContent || "<p>Blank script.</p>"}

USER INSTRUCTION:
${prompt}
        `;

        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        let text = response.text();

        // Strip markdown backticks if Gemini accidentally includes them
        text = text.replace(/^```html\s*/i, '').replace(/```\s*$/i, '');

        return text.trim();
    } catch (error) {
        console.error("Gemini Edit Error:", error);
        throw new Error("Failed to edit script with AI.");
    }
}
