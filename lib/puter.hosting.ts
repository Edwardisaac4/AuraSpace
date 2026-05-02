import { puter, type Hosting } from "@heyputer/puter.js";
import { createHostingSlug, HOSTING_CONFIG_KEY, isHostedUrl, imageUrlToPngBlob, dataUrlToBlob, fetchBlobFromUrl, getImageExtension, getHostedUrl } from "./utils";
type HostingConfig = { subdomain: string; };
type HostedAsset = { url: string };

export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    if (existing?.subdomain) return {subdomain: existing.subdomain};
    const subdomain = createHostingSlug();

    try {
        const created = await puter.hosting.create(subdomain, '.')
        return {subdomain: created.subdomain};
    } catch (error) {
        console.warn(`Couldn't Find Domain: ${error}`)
        return null;
    }
}

export const uploadImageHosting = async ({ hosting, url, projectId, label }: StoreHostedImageParams): Promise<HostedAsset | null> => {
    if (!hosting || !url) return null;
    if (isHostedUrl(url)) return {url};

    try {
        const resolve = label === "rendered" ?
            await imageUrlToPngBlob(url).then((blob) => blob ? { blob, contentType: 'image/png' } : null)
            : await fetchBlobFromUrl(url);
        
        if (!resolve) return null;

        const contentType = resolve.contentType || resolve.blob.type || '';
        const ext = getImageExtension(contentType, url)
        const dir = `projects/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile = new File([resolve.blob], `${label}.${ext}`, {
            type: contentType
        })
        
        await puter.fs.mkdir(dir, {createMissingParents : true});
        await puter.fs.write(filePath, uploadFile);

        const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);
        return hostedUrl ? { url: hostedUrl } : null;

    } catch (error) {
        console.warn(`Failed to Store hosted image: ${error}`);
        return null;
    }
}