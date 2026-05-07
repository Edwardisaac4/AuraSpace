/**
 * puter.hosting.ts — Puter Hosting integration for storing and serving images.
 *
 * This module handles two key responsibilities:
 *  1. Creating (or retrieving) a Puter hosting subdomain for the current user.
 *  2. Uploading image files to that subdomain so they can be accessed via public URLs.
 *
 * The hosting subdomain acts as a lightweight static-site host, allowing
 * AuraSpace to serve project images (source floor plans and AI renders)
 * through persistent, shareable URLs.
 */

import { puter, type Hosting } from "@heyputer/puter.js";
import { createHostingSlug, HOSTING_CONFIG_KEY, isHostedUrl, imageUrlToPngBlob, dataUrlToBlob, fetchBlobFromUrl, getImageExtension, getHostedUrl } from "./utils";

/** Configuration object holding the hosting subdomain string. */
type HostingConfig = { subdomain: string; };

/** Represents a successfully hosted asset with its public URL. */
type HostedAsset = { url: string };

/**
 * Retrieves the existing hosting configuration from Puter's KV store,
 * or creates a new hosting subdomain if one doesn't exist yet.
 *
 * Flow:
 *  1. Check KV store for a previously saved hosting config.
 *  2. If found and valid, return it immediately.
 *  3. Otherwise, generate a unique subdomain slug, create the hosting
 *     entry via `puter.hosting.create()`, persist the config to KV,
 *     and return the new config.
 *
 * @returns The hosting config with the subdomain, or `null` if creation fails.
 */
export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    // Check for an existing hosting config in the key-value store
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    // If a valid subdomain already exists, return it
    if (existing?.subdomain) return {subdomain: existing.subdomain};

    // Generate a new unique subdomain slug (e.g. "auraspace-lxyz12-abc456")
    const subdomain = createHostingSlug();

    try {
        // Create the hosting entry on Puter (the '.' root dir is used as the base)
        const created = await puter.hosting.create(subdomain, '.')
        const config = { subdomain: created.subdomain };

        // Persist the config so future calls can skip creation
        await puter.kv.set(HOSTING_CONFIG_KEY, config);
        return config;
    } catch (error) {
        console.warn(`Couldn't Find Domain: ${error}`)
        return null;
    }
}

/**
 * Uploads an image to the Puter hosting subdomain and returns its public URL.
 *
 * Steps:
 *  1. If no hosting config or URL is provided, bail out early.
 *  2. If the URL is already hosted on Puter, return it as-is (no re-upload needed).
 *  3. Resolve the image data into a `Blob`:
 *     - For rendered images → convert to PNG via `imageUrlToPngBlob()` for consistency.
 *     - For source images  → fetch the raw blob via `fetchBlobFromUrl()`.
 *  4. Determine the correct file extension from the content type.
 *  5. Write the file to Puter's virtual filesystem under `projects/{projectId}/`.
 *  6. Construct and return the public hosted URL.
 *
 * @param params - Destructured `StoreHostedImageParams`:
 *   - `hosting`   – The hosting config (subdomain), or null.
 *   - `url`       – The image URL (base64 data-URL or remote URL).
 *   - `projectId` – Used to namespace the file path.
 *   - `label`     – Either "source" or "rendered" (determines the filename).
 * @returns An object with the hosted `url`, or `null` on failure.
 */
export const uploadImageHosting = async ({ hosting, url, projectId, label }: StoreHostedImageParams): Promise<HostedAsset | null> => {
    // Guard: no hosting config or no URL to upload
    if (!hosting || !url) return null;

    // Skip upload if the image is already hosted on Puter
    if (isHostedUrl(url)) return {url};

    try {
        // Resolve the image data into a Blob
        // - Rendered images are re-encoded as PNG for consistency
        // - Source images are fetched as their original format
        const resolve = label === "rendered" ?
            await imageUrlToPngBlob(url).then((blob) => blob ? { blob, contentType: 'image/png' } : null)
            : await fetchBlobFromUrl(url);
        
        if (!resolve) return null;

        // Determine the file extension from the content type or URL
        const contentType = resolve.contentType || resolve.blob.type || '';
        const ext = getImageExtension(contentType, url)

        // Build the file path within the hosting directory structure
        const dir = `projects/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        // Create a File object from the Blob (required by Puter's write API)
        const uploadFile = new File([resolve.blob], `${label}.${ext}`, {
            type: contentType
        })
        
        // Ensure the project directory exists (creates parent dirs as needed)
        await puter.fs.mkdir(dir, {createMissingParents : true});

        // Write the file to Puter's virtual file system
        await puter.fs.write(filePath, uploadFile);

        // Construct the public URL from the hosting subdomain + file path
        const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);
        return hostedUrl ? { url: hostedUrl } : null;

    } catch (error) {
        console.warn(`Failed to Store hosted image: ${error}`);
        return null;
    }
}