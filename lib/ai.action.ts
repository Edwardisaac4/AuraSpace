/**
 * ai.action.ts — AI-powered image generation using the Puter AI SDK.
 *
 * This module provides the core function that sends a source floor-plan
 * image to Google's Gemini model and receives a photorealistic 3D
 * architectural render in return.
 */

import puter from "@heyputer/puter.js";
import { RENDER_MODES } from "./constants";

/**
 * Fetches a resource at the given URL and converts it into a
 * Base64-encoded data-URL string.
 *
 * This is used to normalise remote image URLs into data-URLs that
 * can be embedded directly in AI model requests.
 *
 * @param url - The URL of the resource to fetch (must be accessible via `fetch()`).
 * @returns A Promise that resolves with the complete data-URL string
 *          (e.g. "data:image/png;base64,iVBOR…").
 * @throws If the fetch request fails (non-2xx status).
 */
export async function fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
    }

    // Convert the response body to a Blob
    const blob = await response.blob();

    // Use FileReader to convert the Blob into a Base64 data-URL
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * Generates a photorealistic render from a 2D floor-plan image
 * using the Gemini AI model via the Puter AI SDK.
 *
 * Supports three render modes:
 *  - "top-down"  – Orthographic bird's-eye 3D view (default).
 *  - "exterior"  – Photorealistic exterior house model.
 *  - "interior"  – Eye-level interior perspective.
 *
 * Flow:
 *  1. Ensure the source image is a data-URL (fetch + convert if it's a remote URL).
 *  2. Split the data-URL into its Base64 payload and MIME type.
 *  3. Look up the correct prompt for the requested render mode.
 *  4. Send the image + prompt to Gemini's `txt2img` endpoint.
 *  5. Extract the rendered image URL from the model's response.
 *  6. If the response URL is remote, convert it to a data-URL for local use.
 *
 * @param params - Destructured `Generate3DViewParams`:
 *   - `sourceImage` – The source floor-plan image (base64 data-URL or remote URL).
 *   - `renderMode`  – Which render mode to use (defaults to "top-down").
 *   - `style`       – Optional design style for exterior/interior modes.
 *   - `roomType`    – Optional room type for interior mode.
 * @returns A Base64 data-URL string of the AI-rendered visualisation.
 * @throws If the image data is invalid or the model returns no image.
 */
export const generate3DView = async ({ sourceImage, renderMode = "top-down", style, roomType }: Generate3DViewParams) => {
    // Step 1: Ensure we have a data-URL (convert remote URLs if needed)
    const dataUrl = sourceImage.startsWith('data:') ? sourceImage : await fetchAsDataUrl(sourceImage);

    // Step 2: Extract the Base64 payload and MIME type from the data-URL
    // Format: "data:<mimeType>;base64,<base64Data>"
    const baseUrl = dataUrl.split(',')[1];       // The raw Base64 string
    const mimeType = dataUrl.split(',')[0].split(':')[1]; // e.g. "image/png;base64"

    if (!mimeType || !baseUrl)
        throw new Error("Invalid image data");

    // Step 3: Look up the prompt generator for the selected render mode
    const modeConfig = RENDER_MODES.find((m) => m.id === renderMode);
    const generatePrompt = modeConfig?.generatePrompt ?? RENDER_MODES[0].generatePrompt;
    const prompt = generatePrompt(style as any, roomType as any);
    
    // Step 4: Call the Gemini model with the mode-specific prompt
    const response = await puter.ai.txt2img(prompt,{
        provider: "gemini",
        model: 'gemini-2.5-flash-image-preview',
        input_image: baseUrl,
        input_image_mime_type: mimeType,
        ratio: {w:1024, h:1024}
    })

    // Step 4: Extract the rendered image URL from the response
    // The Puter SDK returns an HTMLImageElement whose `src` contains the image data
    const rawImageUrl = (response as HTMLImageElement).src ?? null;
    if (!rawImageUrl) throw new Error("no raw image url");

    // Step 5: Normalise to a data-URL if the response was a remote URL
    const renderedImage = rawImageUrl.startsWith('data:') ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);

    return renderedImage;
}