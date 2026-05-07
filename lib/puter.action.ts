/**
 * puter.action.ts — Core Puter actions for authentication and project management.
 *
 * This module wraps the Puter SDK's authentication methods and provides
 * CRUD operations for design projects stored in Puter's key-value store.
 *
 * Data flow:
 *  - Auth:     signIn / signOut / getCurrentUser → Puter Auth SDK
 *  - Projects: createProject / getProjects       → Puter KV Store
 *  - Hosting:  Images are uploaded to Puter hosting via `puter.hosting.ts`
 */

import { puter } from "@heyputer/puter.js";
import { uploadImageHosting, getOrCreateHostingConfig } from "./puter.hosting";

// ─────────────────────────────────────────────
//  Authentication Actions
// ─────────────────────────────────────────────

/**
 * Opens the Puter sign-in dialog for the user.
 * This triggers an OAuth-style flow managed by the Puter SDK.
 */
export const signIn = async () => await puter?.auth?.signIn();

/**
 * Signs the current user out of Puter.
 * Clears the local session token held by the Puter SDK.
 */
export const signOut = async () => puter?.auth?.signOut();

/**
 * Retrieves the currently authenticated Puter user.
 *
 * @returns The user object (with `username`, `uuid`, etc.),
 *          or `null` if no user is signed in or the call fails.
 */
export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser()
    } catch {
        return null;
    }
 }

// ─────────────────────────────────────────────
//  Project Management
// ─────────────────────────────────────────────

/**
 * KV store key under which the array of all saved projects is persisted.
 * Each project is a `DesignItem` object.
 */
const PROJECTS_KEY = "auraspace_projects";

/**
 * Creates (saves) a new design project.
 *
 * Steps:
 *  1. Obtain or create the Puter hosting subdomain.
 *  2. Upload the source image to hosting (if not already hosted).
 *  3. Upload the rendered image to hosting (if available and not already hosted).
 *  4. Resolve final URLs for both images, preferring hosted URLs.
 *  5. Strip local file-system paths (they aren't meaningful after hosting).
 *  6. Prepend the new project to the existing projects array in KV store.
 *
 * @param params - Destructured `CreateProjectParams`:
 *   - `item`       – The `DesignItem` to persist.
 *   - `visibility` – Optional access level (currently unused beyond the type).
 * @returns The saved `DesignItem` with resolved hosted URLs, or `null` on failure.
 */
export const createProject = async({item} : CreateProjectParams):Promise<DesignItem | null | undefined> => {
    const projectId = item.id;

    // Step 1: Ensure we have a hosting subdomain to upload images to
    const hosting = await getOrCreateHostingConfig();
    
    // Step 2: Upload the source floor-plan image to Puter hosting
    const hostedSource = projectId ?
        await uploadImageHosting({
            hosting, url: item.sourceImage, projectId, label: 'source'
        }) : null;
    
    // Step 3: Upload the AI-rendered image (if one exists) to Puter hosting
    const hostedRender = projectId && item.renderedImage ? 
        await uploadImageHosting({
            hosting, url: item.renderedImage, projectId, label: 'rendered'
        }) : null;

    // Step 4a: Resolve the final source image URL
    // Prefer the freshly-hosted URL; fall back to the original image (base64 or remote URL)
    const resolvedSource = hostedSource?.url || item.sourceImage
        
    // Bail out if we couldn't resolve a usable source image URL
    if (!resolvedSource) {
        console.warn('No source image found');
        return null;
    }   

    // Step 4b: Resolve the final rendered image URL (may be null)
    // Fall back to the original rendered image regardless of format
    const resolvedRender = hostedRender?.url || item.renderedImage || null;
    
    // Step 5: Strip local-only path fields — they aren't useful after hosting
    const { sourcePath: _sourcePath, renderedPath: _renderedPath, publicPath: _publicPath, ...rest } = item;
    
    // Build the final payload with hosted URLs
    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    // Step 6: Save the project to the KV store (prepended to existing projects)
    try {
        const existingProjects = await getProjects();
        await puter.kv.set(PROJECTS_KEY, [payload, ...existingProjects]);
        return payload as DesignItem;
    } catch (error)  {
        console.log('Error Saving File');
        return null;
    }
}

/**
 * Retrieves all saved design projects from Puter's key-value store.
 *
 * @returns An array of `DesignItem` objects, or an empty array if
 *          nothing is stored or an error occurs.
 */
export const getProjects = async (): Promise<DesignItem[]> => {
    try {
        const stored = await puter.kv.get(PROJECTS_KEY);
        return (stored as unknown as DesignItem[]) || [];
    } catch {
        return [];
    }
};

