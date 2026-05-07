/**
 * utils.ts — Shared utility functions for hosting, image conversion, and URL handling.
 *
 * These helpers are consumed by `puter.hosting.ts`, `puter.action.ts`, and
 * `ai.action.ts` to resolve URLs, convert blobs, and extract file extensions.
 */

// ─────────────────────────────────────────────
//  Hosting Constants
// ─────────────────────────────────────────────

/** Key used in Puter's KV store to persist the hosting subdomain config. */
export const HOSTING_CONFIG_KEY = "auraspace_hosting_config";

/** Domain suffix for Puter-hosted static sites (e.g. "my-slug.puter.site"). */
export const HOSTING_DOMAIN_SUFFIX = ".puter.site";

// ─────────────────────────────────────────────
//  URL Helpers
// ─────────────────────────────────────────────

/**
 * Type-guard that checks whether a value is a string pointing to a
 * Puter-hosted URL (i.e. contains ".puter.site").
 *
 * @param value - Any value to check.
 * @returns `true` if `value` is a string containing the hosting domain suffix.
 */
export const isHostedUrl = (value: unknown): value is string =>
    typeof value === "string" && value.includes(HOSTING_DOMAIN_SUFFIX);

/**
 * Generates a unique hosting slug for a new Puter subdomain.
 * Format: `auraspace-<base36-timestamp>-<random-6-chars>`
 *
 * @returns A unique subdomain slug string.
 */
export const createHostingSlug = () =>
    `auraspace-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

/**
 * Ensures a subdomain string ends with the hosting domain suffix.
 * If it already includes the suffix, the string is returned as-is.
 *
 * @param subdomain - The raw subdomain (e.g. "auraspace-abc123").
 * @returns The fully-qualified hostname (e.g. "auraspace-abc123.puter.site").
 */
const normalizeHost = (subdomain: string) =>
    subdomain.endsWith(HOSTING_DOMAIN_SUFFIX)
        ? subdomain
        : `${subdomain}${HOSTING_DOMAIN_SUFFIX}`;

/**
 * Constructs a full HTTPS URL for a hosted file.
 *
 * @param hosting  - Object containing the `subdomain` string.
 * @param filePath - The path to the file relative to the hosting root
 *                   (e.g. "projects/123/source.png").
 * @returns The complete URL, or `null` if no subdomain is available.
 */
export const getHostedUrl = (
    hosting: { subdomain: string },
    filePath: string,
): string | null => {
    if (!hosting?.subdomain) return null;
    const host = normalizeHost(hosting.subdomain);
    return `https://${host}/${filePath}`;
};

// ─────────────────────────────────────────────
//  Image Extension Detection
// ─────────────────────────────────────────────

/**
 * Determines the file extension for an image given its MIME content-type
 * and/or its URL. The function tries three strategies in order:
 *
 *  1. Parse the extension from the `Content-Type` header (e.g. "image/png" → "png").
 *  2. Parse the MIME type embedded in a data-URL (e.g. "data:image/jpeg;base64,…" → "jpg").
 *  3. Extract the extension from the URL path (e.g. "https://…/photo.webp" → "webp").
 *
 * Falls back to "png" if none of the strategies succeed.
 *
 * @param contentType - The MIME content-type string (may be empty).
 * @param url         - The image URL (remote URL or data-URL).
 * @returns A lowercase file extension string (without the leading dot).
 */
export const getImageExtension = (contentType: string, url: string): string => {
    // Strategy 1: Parse from Content-Type header
    const type = (contentType || "").toLowerCase();
    const typeMatch = type.match(/image\/(png|jpe?g|webp|gif|svg\+xml|svg)/);
    if (typeMatch?.[1]) {
        const ext = typeMatch[1].toLowerCase();
        return ext === "jpeg" || ext === "jpg"
            ? "jpg"
            : ext === "svg+xml"
                ? "svg"
                : ext;
    }

    // Strategy 2: Parse from data-URL MIME prefix
    const dataMatch = url.match(/^data:image\/([a-z0-9+.-]+);/i);
    if (dataMatch?.[1]) {
        const ext = dataMatch[1].toLowerCase();
        return ext === "jpeg" ? "jpg" : ext;
    }

    // Strategy 3: Extract file extension from the URL path
    const extMatch = url.match(/\.([a-z0-9]+)(?:$|[?#])/i);
    if (extMatch?.[1]) return extMatch[1].toLowerCase();

    // Fallback
    return "png";
};

// ─────────────────────────────────────────────
//  Blob Conversion Utilities
// ─────────────────────────────────────────────

/**
 * Converts a Base64 data-URL string into a `Blob` object.
 *
 * Supports both Base64-encoded (`data:…;base64,…`) and
 * percent-encoded (`data:…,…`) data URLs.
 *
 * @param dataUrl - A valid `data:` URL string.
 * @returns An object containing the `Blob` and its `contentType`,
 *          or `null` if parsing fails.
 */
export const dataUrlToBlob = (
    dataUrl: string,
): { blob: Blob; contentType: string } | null => {
    try {
        // Regex captures: [1] MIME type, [2] ";base64" flag, [3] encoded data
        const match = dataUrl.match(/^data:([^;]+)?(;base64)?,([\\s\\S]*)$/i);
        if (!match) return null;
        const contentType = match[1] || "";
        const isBase64 = !!match[2];
        const data = match[3] || "";

        // Decode the raw binary string
        const raw = isBase64
            ? atob(data.replace(/\s/g, ""))
            : decodeURIComponent(data);

        // Convert to a byte array and wrap in a Blob
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
        }
        return { blob: new Blob([bytes], { type: contentType }), contentType };
    } catch {
        return null;
    }
};

/**
 * Fetches a blob from a URL. If the URL is a data-URL, it delegates
 * to `dataUrlToBlob()` for synchronous parsing. Otherwise it performs
 * a network `fetch()`.
 *
 * @param url - A remote URL or data-URL string.
 * @returns An object with the `Blob` and its `contentType`, or `null` on failure.
 */
export const fetchBlobFromUrl = async (
    url: string,
): Promise<{ blob: Blob; contentType: string } | null> => {
    // Data URLs can be parsed locally without a network request
    if (url.startsWith("data:")) {
        return dataUrlToBlob(url);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");
        return {
            blob: await response.blob(),
            contentType: response.headers.get("content-type") || "",
        };
    } catch {
        return null;
    }
};

/**
 * Loads an image from a URL and re-encodes it as a PNG `Blob` using
 * an off-screen `<canvas>`. This is useful for normalising different
 * image formats (JPEG, WebP) into a consistent PNG before uploading.
 *
 * ⚠️  Requires a browser environment (`window`, `document`, `Image`).
 *     Returns `null` when called during SSR.
 *
 * @param url - The image URL to load and convert.
 * @returns A PNG `Blob`, or `null` if loading/conversion fails.
 */
export const imageUrlToPngBlob = async (url: string): Promise<Blob | null> => {
    // Guard: skip during server-side rendering
    if (typeof window === "undefined") return null;

    try {
        // Create an off-screen <img> element and load the source image
        const img = new Image();
        img.crossOrigin = "anonymous"; // Needed for cross-origin canvas operations

        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });

        // Read the image's natural dimensions
        const width = loaded.naturalWidth || loaded.width;
        const height = loaded.naturalHeight || loaded.height;
        if (!width || !height) return null;

        // Draw the image onto an off-screen canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(loaded, 0, 0, width, height);

        // Export the canvas content as a PNG blob
        return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png");
        });
    } catch {
        return null;
    }
};