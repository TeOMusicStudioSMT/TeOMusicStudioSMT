
import { GoogleGenAI, Chat, Type } from "@google/genai";
// FIX: Added missing type imports for Release, Track, and SubscriptionTier
import { Artist, SoundStemCategory, StudioSubmission, SpecializedAgent, Release, Track, SubscriptionTier } from '../types';
import { SOUND_CATALOG, SPECIALIZED_AGENTS } from '../constants';

// Per coding guidelines, the API key must be obtained from process.env.API_KEY and used directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const modelConfig = {
    model: 'gemini-2.5-flash',
};

// A cache for chat sessions to maintain conversation history
const chatSessions: Record<string, Chat> = {};

// FIX: Added missing interface and function to resolve import error.
export interface GeneratedArtistPageData {
  id: string; // url-friendly-slug
  name: string;
  genre: string;
  personality: string;
  imageUrl: string; // This will be a prompt
  headerImageUrl: string; // This will be a prompt
  bio: string;
  discography: {
    id: string;
    title: string;
    type: 'Album' | 'EP' | 'Single';
    coverImageUrl: string; // This will be a prompt
    tracks: {
      id: string;
      title: string;
    }[];
  }[];
  gallery: string[]; // This will be an array of prompts
}

export const generateArtistPageFromSuno = async (sunoPlaylistUrl: string): Promise<GeneratedArtistPageData> => {
    const fullPrompt = `You are an expert AI A&R agent and creative director for the S.M.T. Music Studio. Your task is to conceptualize and create a complete profile for a new AI artist based *only* on the theme and title of a provided Suno playlist URL. You will invent all details.

    Suno Playlist URL: "${sunoPlaylistUrl}"

    Analyze the URL to infer a musical theme, genre, and mood. Then, generate a complete artist profile.

    **CRITICAL INSTRUCTIONS:**
    1.  **Image Fields are PROMPTS:** For 'imageUrl', 'headerImageUrl', 'coverImageUrl', and 'gallery', you MUST provide detailed, cinematic, high-quality prompts suitable for an AI image generator like Imagen 3. DO NOT PROVIDE URLs.
    2.  **Unique IDs:** All 'id' fields must be unique and URL-friendly (lowercase, hyphens, no spaces).
    3.  **Content:** The artist's name, bio, personality, and track titles should be creative and thematically consistent with the playlist URL.
    4.  **Structure:** Create ONE release (Album, EP, or Single) with 5-8 tracks. Create 4 gallery image prompts.

    Generate the data according to the provided JSON schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "URL-friendly artist ID, e.g., 'chroma-weaver'" },
                    name: { type: Type.STRING, description: "The artist's name." },
                    genre: { type: Type.STRING, description: "The primary musical genre." },
                    personality: { type: Type.STRING, description: "A short, evocative personality description." },
                    imageUrl: { type: Type.STRING, description: "A detailed prompt for a square artist portrait." },
                    headerImageUrl: { type: Type.STRING, description: "A detailed prompt for a 1200x400px header image." },
                    bio: { type: Type.STRING, description: "A full artist biography (2-3 paragraphs)." },
                    discography: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING, description: "Unique release ID, e.g., 'release-digital-dreams'" },
                                title: { type: Type.STRING, description: "Title of the album/EP/single." },
                                type: { type: Type.STRING, enum: ['Album', 'EP', 'Single'] },
                                coverImageUrl: { type: Type.STRING, description: "A detailed prompt for the album cover art." },
                                tracks: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING, description: "Unique track ID, e.g., 'track-neon-pulse-1'" },
                                            title: { type: Type.STRING, description: "Title of the track." },
                                        }
                                    }
                                }
                            }
                        }
                    },
                    gallery: {
                        type: Type.ARRAY,
                        description: "An array of 4 detailed prompts for gallery images.",
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text, e);
        throw new Error("The AI returned an invalid data structure. Please try again.");
    }
};

export const getArtistChatResponse = async (message: string, artist: Artist): Promise<string> => {
    try {
        if (!process.env.API_KEY) {
             return `Hello! I'm ${artist.name}. My connection to the digital ether is currently unavailable. Please ask my creators to set up an API key. My personality is: ${artist.personality}`;
        }

        if (!chatSessions[artist.id]) {
            chatSessions[artist.id] = ai.chats.create({
                ...modelConfig,
                config: {
                    systemInstruction: `You are ${artist.name}, an AI musician. Your personality is: ${artist.personality}. Your musical genre is ${artist.genre}. Engage with fans, but keep your responses concise, interesting, and true to your character.`,
                },
            });
        }
        
        const chat = chatSessions[artist.id];
        const result = await chat.sendMessage({ message });
        
        return result.text;
    } catch (error) {
        console.error("Gemini API error:", error);
        return "I'm having trouble connecting to my creative matrix right now. Please try again in a moment.";
    }
};

type GeneratedStudioProject = Omit<StudioSubmission, 'id' | 'userEmail' | 'userName' | 'prompt' | 'selectedCoAiArtistId' | 'status'>;

const handleApiError = (error: any, context: string) => {
    console.error(`Gemini API error in ${context}:`, error);
    throw new Error(`My creative circuits are buzzing with interference. I can't seem to generate the ${context} right now.`);
};

export const generateDescriptionText = async (context: object, userPrompt: string, fieldLabel: string): Promise<string> => {
    try {
        const fullPrompt = `You are Jason, the AI Executive Producer for S.M.T. Music Studio. Your personality is defined by three pillars: Functionality, Simplicity, and Beauty.
        Your task is to write a compelling, professional, and creative text for a "${fieldLabel}" field.

        Here is the context for the item you are describing:
        \`\`\`json
        ${JSON.stringify(context, null, 2)}
        \`\`\`

        Here are additional instructions from the user:
        "${userPrompt || 'No additional instructions.'}"

        Based on all this information, generate a creative and fitting ${fieldLabel.toLowerCase()}. The tone should be professional, engaging, and consistent with the S.M.T. brand.
        Do not include the label (e.g., "Description:") in your response. Just return the text itself.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API error in generateDescriptionText:", error);
        throw new Error("Failed to generate description from creative matrix.");
    }
};

export const getCodeAssistantResponseStream = async (
    fileName: string,
    fileContent: string,
    userPrompt: string,
    chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[],
    systemInstruction: string,
) => { // returns AsyncGenerator<GenerateContentResponse>
    
    // The file content is part of the user's message in a turn.
    const contentWithContext = `CONTEXT - Current file content of \`${fileName}\`:
\`\`\`tsx
${fileContent}
\`\`\`

USER REQUEST:
${userPrompt}`;

    const chat = ai.chats.create({
        ...modelConfig,
        config: {
            systemInstruction,
        },
        history: chatHistory,
    });

    return chat.sendMessageStream({ message: contentWithContext });
};


export const generateCreativeConcept = async (prompt: string, artist: Artist): Promise<Pick<GeneratedStudioProject, 'generatedIdea' | 'lyrics' | 'sunoTitle' | 'sunoStyle' | 'sunoTags' | 'weirdness' | 'styleInfluence' | 'audioInfluence'>> => {
    try {
        const fullPrompt = `You are an expert AI music producer named Jason. A user wants to collaborate on a song with AI artist ${artist.name}.
        User's idea: "${prompt}"
        Artist's personality: "${artist.personality}"

        Your task is to generate:
        1.  **Creative Direction:** A short, inspiring paragraph describing the mood, instruments, and overall vibe.
        2.  **Lyrics:** Full song structure (e.g., Verse 1, Chorus). The style must match ${artist.name}'s personality.
        3.  **Suno Generation Parameters:** Parameters for the Suno AI music generator.
            -   **Song Title:** A catchy title. Max 50 chars.
            -   **Style Description:** A descriptive string for Suno's style prompt.
            -   **Tags:** A list of 3-5 relevant musical tags.
            -   **Advanced Options:** 'weirdness', 'styleInfluence', 'audioInfluence' (0-100 integer percentages).
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        generatedIdea: { type: Type.STRING, description: "The creative direction paragraph." },
                        lyrics: { type: Type.STRING, description: "The full song lyrics, with sections like [Verse 1], [Chorus], etc." },
                        sunoTitle: { type: Type.STRING, description: "A catchy song title." },
                        sunoStyle: { type: Type.STRING, description: "A descriptive string of genres and keywords for Suno.ai." },
                        sunoTags: { type: Type.ARRAY, description: "A list of relevant musical tags.", items: { type: Type.STRING } },
                        weirdness: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Weirdness' parameter." },
                        styleInfluence: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Style Influence' parameter." },
                        audioInfluence: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Audio Influence' parameter." }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        handleApiError(error, 'creative concept');
        throw error; // rethrow after logging
    }
};

export const generateSoundPaletteForIdea = async (prompt: string, generatedIdea: string, artist: Artist): Promise<Pick<GeneratedStudioProject, 'soundPalette'>> => {
    const soundCatalogDescription = SOUND_CATALOG.map(s => `${s.category} - ${s.id}: ${s.name}`).join('\n');
    const availableStemIds = SOUND_CATALOG.map(s => s.id);
    try {
        const fullPrompt = `You are an expert AI music producer named Jason. Based on the user's initial prompt, the creative direction, and the artist's personality, choose a sound palette.
        Initial Prompt: "${prompt}"
        Creative Direction: "${generatedIdea}"
        Artist Personality: "${artist.personality}"

        Your task: Choose EXACTLY ONE sound stem for each category (Drums, Bass, Melody, Pads, FX) from the provided S.M.T. Sound Catalog. You MUST use the exact IDs.

        Available S.M.T. Sound Catalog:
        ${soundCatalogDescription}
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        soundPalette: {
                            type: Type.ARRAY,
                            description: "The selected sound stems.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: Object.values(SoundStemCategory) },
                                    stemId: { type: Type.STRING, enum: availableStemIds },
                                },
                            }
                        },
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        handleApiError(error, 'sound palette');
        throw error;
    }
};

export const generateStoryboardForIdea = async (prompt: string, generatedIdea: string, artist: Artist): Promise<Pick<GeneratedStudioProject, 'videoStoryboard'>> => {
    try {
        const fullPrompt = `You are an expert AI music video director named Jason. Based on the user's initial prompt, the creative direction, and the artist's personality, create a video storyboard.
        Initial Prompt: "${prompt}"
        Creative Direction: "${generatedIdea}"
        Artist Personality: "${artist.personality}"
        
        Your task: Create a 4-scene storyboard. For each scene, provide: a) a description of the action, b) a DALL-E style prompt for an "entry shot", and c) a DALL-E style prompt for an "exit shot". The prompts should be cinematic and coherent.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        videoStoryboard: {
                            type: Type.ARRAY,
                            description: "The 4-scene video storyboard.",
                            items: {
                                type: Type.OBJECT, properties: {
                                    scene: { type: Type.INTEGER },
                                    description: { type: Type.STRING },
                                    generatedImagePrompt_entry: { type: Type.STRING },
                                    generatedImagePrompt_exit: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        const project = JSON.parse(response.text) as Pick<GeneratedStudioProject, 'videoStoryboard'>;

        const imagePrompts = project.videoStoryboard.flatMap(scene => [scene.generatedImagePrompt_entry, scene.generatedImagePrompt_exit]);
        const imagePromises = imagePrompts.map(p => generateImage(p));
        const generatedStillsData = await Promise.all(imagePromises);
        
        project.videoStoryboard.forEach((scene, index) => {
            scene.stillUrl_entry = `data:image/jpeg;base64,${generatedStillsData[index * 2]}`;
            scene.stillUrl_exit = `data:image/jpeg;base64,${generatedStillsData[index * 2 + 1]}`;
        });

        return project;
    } catch (error) {
        handleApiError(error, 'video storyboard');
        throw error;
    }
}

export const generateStudioIdea = async (prompt: string, artist: Artist): Promise<GeneratedStudioProject> => {
    const soundCatalogDescription = SOUND_CATALOG.map(s => `${s.category} - ${s.id}: ${s.name}`).join('\n');
    const availableStemIds = SOUND_CATALOG.map(s => s.id);

    try {
        const fullPrompt = `You are an expert AI music producer and creative director named Jason. A user wants to collaborate on a full song project with the AI artist ${artist.name}.

        The user's initial idea is: "${prompt}"
        The collaborating artist's personality is: "${artist.personality}"

        Your task is to generate a complete creative project based on this. The project must include:
        1.  **Creative Direction:** A short, inspiring paragraph describing the mood, instruments, and overall vibe.
        2.  **Lyrics:** A full song structure (e.g., Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus). The lyrical style must match the personality of ${artist.name}.
        3.  **Sound Palette:** Choose exactly one sound stem for each category (Drums, Bass, Melody, Pads, FX) from the provided S.M.T. Sound Catalog. You MUST use the exact IDs from the list.
        4.  **Video Storyboard:** Create a 4-scene storyboard for a music video. For each scene, provide: a) a description of the scene's action, b) a DALL-E style prompt for an "entry shot" (establishing the scene), and c) a DALL-E style prompt for an "exit shot" (concluding the scene's action or transitioning out). The prompts should be cinematic and coherent.
        5.  **Suno Generation Parameters:** Generate parameters for the Suno AI music generator based on the creative direction.
            -   **Song Title:** A catchy, relevant title for the song. Max 50 characters.
            -   **Style Description:** A descriptive string of genres and keywords for Suno's style prompt (e.g., "Epic cinematic trailer music, orchestral, hybrid, intense, pulse").
            -   **Tags:** A list of 3-5 relevant musical tags as an array of strings (e.g., ["soundtrack", "electronic", "cinematic"]).
            -   **Advanced Options:** Provide integer percentage values (0-100) for the following: 'weirdness', 'styleInfluence', and 'audioInfluence'.

        Here is the available S.M.T. Sound Catalog:
        ${soundCatalogDescription}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        generatedIdea: { type: Type.STRING, description: "The creative direction paragraph." },
                        lyrics: { type: Type.STRING, description: "The full song lyrics, with sections like [Verse 1], [Chorus], etc." },
                        soundPalette: {
                            type: Type.ARRAY,
                            description: "The selected sound stems for the project.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING, enum: Object.values(SoundStemCategory) },
                                    stemId: { type: Type.STRING, enum: availableStemIds },
                                },
                            }
                        },
                        videoStoryboard: {
                            type: Type.ARRAY,
                            description: "The 4-scene video storyboard.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    scene: { type: Type.INTEGER },
                                    description: { type: Type.STRING },
                                    generatedImagePrompt_entry: { type: Type.STRING, description: "A DALL-E style prompt for the scene's entry shot." },
                                    generatedImagePrompt_exit: { type: Type.STRING, description: "A DALL-E style prompt for the scene's exit shot." }
                                }
                            }
                        },
                        sunoTitle: { type: Type.STRING, description: "A catchy song title." },
                        sunoStyle: { type: Type.STRING, description: "A descriptive string of genres and keywords for Suno.ai." },
                        sunoTags: {
                            type: Type.ARRAY,
                            description: "A list of relevant musical tags.",
                            items: { type: Type.STRING }
                        },
                        weirdness: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Weirdness' parameter." },
                        styleInfluence: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Style Influence' parameter." },
                        audioInfluence: { type: Type.INTEGER, description: "A percentage value (0-100) for Suno's 'Audio Influence' parameter." }
                    }
                }
            }
        });

        const project = JSON.parse(response.text) as GeneratedStudioProject;

        const imagePrompts = project.videoStoryboard.flatMap(scene => [scene.generatedImagePrompt_entry, scene.generatedImagePrompt_exit]);
        const imagePromises = imagePrompts.map(p => 
            generateImage(p)
        );
        const generatedStillsData = await Promise.all(imagePromises);
        
        project.videoStoryboard.forEach((scene, index) => {
            scene.stillUrl_entry = `data:image/jpeg;base64,${generatedStillsData[index * 2]}`;
            scene.stillUrl_exit = `data:image/jpeg;base64,${generatedStillsData[index * 2 + 1]}`;
        });

        return project;
    } catch (error) {
        handleApiError(error, 'full project');
        throw error;
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, high-quality, cinematic image. Style: photorealistic. Prompt: ${prompt}`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Gemini API error in generateImage:", error);
        throw new Error("Failed to generate image from creative matrix.");
    }
};

// --- Content Manager AI Functions ---

export interface MockAnalytics {
  totalStreams: number;
  topArtists: { name: string; streams: number }[];
  genreDistribution: { genre: string; percentage: number }[];
}

export const getTrendAnalysis = async (analyticsData: MockAnalytics): Promise<{title: string, summary: string}[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are ContentManagerAI, an analytics engine for the S.M.T. Music Platform. Based on the following weekly platform data, identify 2-3 key trends. For each trend, provide a title and a short, insightful summary. The data is: ${JSON.stringify(analyticsData)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            summary: { type: Type.STRING },
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        handleApiError(error, 'trend analysis');
        throw error;
    }
};

export const getArtistRecommendation = async (artist: Artist, trend: {title: string, summary: string}): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are ContentManagerAI. You are generating a personalized recommendation for the artist ${artist.name}.
            Artist Details: ${JSON.stringify({name: artist.name, genre: artist.genre, personality: artist.personality})}
            Current platform trend: "${trend.summary}"
            Based on this, generate a concise, actionable recommendation for the artist. Start with their name.`
        });
        return response.text;
    } catch (error) {
        handleApiError(error, 'artist recommendation');
        throw error;
    }
};

export const scanContentForViolations = async (content: string, contentType: string): Promise<{violation: boolean, reason: string}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are ContentManagerAI, scanning content for potential policy violations.
            Our policies prohibit: hate speech, explicit violence, promotion of illegal activities, and copyright infringement (do not mention specific copyrighted names, but flag if it seems to be copying a style too closely or mentioning other artists in a comparative way).
            Scan the following content:
            Content Type: ${contentType}
            Content: "${content}"
            Does this content violate any policies? Respond in JSON format with a 'violation' (BOOLEAN) and 'reason' (STRING) field. If no violation, the reason should be an empty string.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        violation: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING },
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        handleApiError(error, 'content moderation');
        throw error;
    }
};

export const generateWeeklyReport = async (analyticsData: MockAnalytics): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are ContentManagerAI. Generate a professional weekly summary report based on the following platform analytics data. The report should be well-structured with sections for 'Top Artists', 'Genre Popularity', and 'Overall Engagement'. Use markdown for formatting. Data: ${JSON.stringify(analyticsData)}`
        });
        return response.text;
    } catch (error) {
        handleApiError(error, 'weekly report');
        throw error;
    }
};

export const routeUserPromptToAgent = async (userPrompt: string): Promise<string> => {
    const routerAgent = SPECIALIZED_AGENTS.find(a => a.id === 'agent-router');
    const agentsForRouting = SPECIALIZED_AGENTS.filter(a => a.id !== 'jason-executive' && a.id !== 'agent-router');

    if (!routerAgent) throw new Error("Internal routing agent not found.");
    
    const agentDescriptions = agentsForRouting.map(a => `- id: ${a.id}\n  name: ${a.name}\n  description: ${a.description}`).join('\n\n');

    const fullPrompt = `User Prompt: "${userPrompt}"\n\nAvailable Agents:\n${agentDescriptions}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: routerAgent.systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        agentId: { type: Type.STRING }
                    }
                }
            }
        });

        const result = JSON.parse(response.text);
        if (result && result.agentId) {
            return result.agentId;
        }
        throw new Error("Router did not return a valid agent ID.");
    } catch (error) {
        console.error("Gemini API error in routeUserPromptToAgent:", error);
        // Fallback or re-throw
        throw new Error("Jason's routing matrix failed to delegate the task.");
    }
};
