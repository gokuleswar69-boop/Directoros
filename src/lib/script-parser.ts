export interface ParsedScene {
    scene_number: string;
    slugline: string;
    body: string;
    characters: string[];
    time_of_day?: "Day" | "Night" | "Evening" | string;
    shoot_date?: string;
    completed?: boolean;
    analysis?: {
        title?: string;
        summary: string;
        cast: string[];
        complexity: "Low" | "Medium" | "High";
    };
}

export const parseScript = (text: string): ParsedScene[] => {
    // Simple regex for Sluglines: INT. or EXT. followed by ANYTHING until newline
    const sceneRegex = /((?:INT\.|EXT\.|I\/E\.|INT\/EXT\.).+?)$/gm;

    const scenes: ParsedScene[] = [];
    const lines = text.split(/\r?\n/);

    let currentScene: ParsedScene | null = null;
    let buffer: string[] = [];
    let sceneCounter = 1;

    lines.forEach((line) => {
        // Check if line is a scene header
        if (line.match(/^(?:INT\.|EXT\.|I\/E\.|INT\/EXT\.)/i)) {
            // If we have a current scene, push it (ignore empty duplicate headers)
            if (currentScene && currentScene.slugline.trim() !== "") {
                const body = buffer.join("\n").trim();
                // Filter out complete duplicates or accidental empty headers
                if (body || currentScene.slugline) {
                    (currentScene as ParsedScene).body = body;
                    scenes.push(currentScene as ParsedScene);
                }
            }

            // Start new scene
            currentScene = {
                scene_number: String(sceneCounter++),
                slugline: line.trim(),
                characters: [],
                body: "", // Initialize body to an empty string
                completed: false,
            };
            buffer = []; // Reset buffer
        } else {
            // Append content to buffer if we are in a scene
            if (currentScene) {
                buffer.push(line);
            }
        }
    });

    // Push last scene
    if (currentScene && (currentScene as ParsedScene).slugline && (currentScene as ParsedScene).slugline.trim() !== "") {
        (currentScene as ParsedScene).body = buffer.join("\n").trim();
        scenes.push(currentScene as ParsedScene);
    }

    // Final deduplication pass to remove literal identical consecutive duplicates if any
    return scenes.filter((scene: ParsedScene, index: number, self: ParsedScene[]) =>
        index === self.findIndex((s: ParsedScene) => s.slugline === scene.slugline && s.body === scene.body)
    );
};
