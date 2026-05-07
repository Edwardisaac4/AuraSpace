/**
 * constants.ts — Application-wide configuration values and the AI render prompt.
 *
 * All "magic numbers" and environment-dependent URLs are centralised here
 * so they can be tuned in a single place without hunting through components.
 */

// ─────────────────────────────────────────────
//  Environment
// ─────────────────────────────────────────────

/**
 * Base URL for the Puter worker endpoint.
 * Falls back to an empty string when the env var is not set
 * (e.g. during local development without a worker).
 */
export const PUTER_WORKER_URL = import.meta.env.VITE_PUTER_WORKER_URL || "";

// ─────────────────────────────────────────────
//  Storage Paths
// ─────────────────────────────────────────────

/**
 * File-system paths used inside Puter's virtual file system.
 * All project assets (source images, rendered images) are stored
 * under the `auraspace/` root directory.
 */
export const STORAGE_PATHS = {
    /** Top-level directory for all AuraSpace data. */
    ROOT: "auraspace",
    /** Directory where original uploaded floor-plan images are saved. */
    SOURCES: "auraspace/sources",
    /** Directory where AI-rendered 3D visualisations are saved. */
    RENDERS: "auraspace/renders",
} as const;

// ─────────────────────────────────────────────
//  Timing Constants (in milliseconds)
// ─────────────────────────────────────────────

/**
 * How long the "Shared!" confirmation badge stays visible
 * before resetting back to idle state.
 */
export const SHARE_STATUS_RESET_DELAY_MS = 1500;

/**
 * Percentage points to add per tick during the simulated upload
 * progress animation in the hero section.
 */
export const PROGRESS_INCREMENT = 15;

/**
 * Delay (ms) after the upload progress bar hits 100% before
 * triggering the `onComplete` callback and navigating to the visualiser.
 */
export const REDIRECT_DELAY_MS = 600;

/**
 * Interval (ms) between each progress-bar tick during
 * the simulated upload animation.
 */
export const PROGRESS_INTERVAL_MS = 100;

/**
 * Percentage points added to the progress bar on each tick
 * (used inside the `Upload` component's `setInterval` loop).
 */
export const PROGRESS_STEP = 5;

// ─────────────────────────────────────────────
//  UI Constants
// ─────────────────────────────────────────────

/** CSS `background-size` value for the decorative grid overlay on the upload card. */
export const GRID_OVERLAY_SIZE = "60px 60px";

/** Colour used for the grid overlay lines (a soft blue). */
export const GRID_COLOR = "#3B82F6";

// ─────────────────────────────────────────────
//  HTTP Status Codes
// ─────────────────────────────────────────────

/**
 * HTTP status codes that indicate the user's session has expired
 * or they lack permission. Used to trigger a re-authentication flow.
 */
export const UNAUTHORIZED_STATUSES = [401, 403];

// ─────────────────────────────────────────────
//  Image Dimensions
// ─────────────────────────────────────────────

/**
 * Width and height (in pixels) used when requesting AI-rendered images.
 * The Gemini model receives a 1024×1024 canvas.
 */
export const IMAGE_RENDER_DIMENSION = 1024;

// ─────────────────────────────────────────────
//  AI Render Prompt
// ─────────────────────────────────────────────

/**
 * The master prompt sent to the Gemini image model to convert
 * a 2D floor plan into a photorealistic top-down 3D architectural render.
 *
 * Key instructions:
 *  - Remove all text / labels from the floor plan.
 *  - Match the original geometry exactly (walls, doors, windows).
 *  - Use an orthographic (flat) top-down camera angle.
 *  - Apply realistic materials per room type (wood, tile, marble, etc.).
 *  - Add subtle lifestyle touches (plants, throw cushions, towels).
 *  - Use warm daylight lighting with soft shadows.
 */
export const AURASPACE_RENDER_PROMPT = `
TASK: Convert this 2D floor plan into a photorealistic top-down 3D architectural render.

RULES (strict):
1) REMOVE ALL TEXT — no labels, dimensions, annotations. Fill those areas with continuous flooring.
2) MATCH GEOMETRY EXACTLY — walls, rooms, doors, windows must follow the plan's lines and positions precisely. No shifts or resizing.
3) ORTHOGRAPHIC TOP-DOWN VIEW only. Zero perspective tilt.
4) NO EXTRA CONTENT — do not invent rooms, furniture, or objects not clearly shown in the plan.

STRUCTURE:
- Walls: extruded from plan lines, consistent height/thickness, painted in warm off-white or light grey.
- Doors: convert swing arcs into realistic open doors with visible wood grain.
- Windows: convert perimeter lines into glass panes with subtle reflections and thin frames.

MATERIALS (per room type):
- Living/dining areas: warm oak hardwood flooring.
- Bedrooms: light maple or ash wood flooring, plush area rug beside the bed.
- Kitchen: light stone or ceramic tile, marble-look countertops.
- Bathrooms: white hexagonal or subway tile, chrome fixtures.
- Hallways/entries: neutral stone or wood-look tile.
- Patio/balcony: natural stone or composite decking.

FURNITURE (only where icons/fixtures are clearly shown):
- Bed → bed with linen duvet, pillows, and a small nightstand.
- Sofa → modern sectional with throw cushions.
- Dining → table with chairs, minimal centrepiece.
- Kitchen → counters, sink, stove, subtle utensil details.
- Bathroom → toilet, vanity sink, tub or shower enclosure.
- Office → desk, ergonomic chair, small shelf.
- Utility → washer/dryer, simple cabinetry.

ATMOSPHERE & LIFESTYLE TOUCHES:
- Add 1-2 small potted plants or greenery per room where space allows.
- Include subtle decorative elements: a folded towel in bathrooms, a book on a nightstand.

LIGHTING & SHADOWS:
- Warm, bright daylight. Colour temperature ~5500K. High clarity.
- Soft shadows cast from top-left, giving depth to walls and furniture.
- Subtle ambient occlusion at wall-floor junctions.

NEGATIVE (avoid): blurriness, text, watermarks, logos, sketch lines, hand-drawn look, dark or moody lighting, oversaturation, floating objects, distorted geometry.
`.trim();

// ─────────────────────────────────────────────
//  Design Styles & Rooms
// ─────────────────────────────────────────────

export const DESIGN_STYLES: DesignStyle[] = ["Modern", "Minimalist", "Industrial", "Classic", "Rustic"];
export const ROOM_TYPES: RoomType[] = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room"];

// ─────────────────────────────────────────────
//  AI Exterior Prompt Generator
// ─────────────────────────────────────────────

/**
 * Generates a prompt for a photorealistic exterior view of the house
 * based on the uploaded floor plan and selected style.
 */
export const generateExteriorPrompt = (style: DesignStyle = "Modern") => `
TASK: Using this 2D floor plan as reference, generate a photorealistic exterior view of the house it represents.

RULES (strict):
1) INFER THE BUILDING SHAPE from the floor plan outline — walls, room positions, and overall footprint define the exterior shape.
2) SINGLE FRONT-FACING PERSPECTIVE — show the house from a 3/4 front angle at eye level, as if photographed from the street.
3) REALISTIC PROPORTIONS — single or two-story based on apparent floor plan complexity. Standard residential ceiling height.
4) NO TEXT, LABELS, OR ANNOTATIONS anywhere in the image.

DESIGN STYLE: ${style}
- Ensure architectural details, facade materials, and roof style match the ${style} aesthetic.

ARCHITECTURE:
- Roof: modern gable or hip roof with clean lines (adjust based on ${style}).
- Facade: materials matching the ${style} aesthetic (e.g. render, stone, wood cladding, brick).
- Windows: appropriate for ${style}. Position them to match room locations from the plan.
- Front door: an entry door fitting the ${style}.
- Garage: include if the plan shows a garage or large utility area near the entrance.

LANDSCAPING:
- Neatly manicured front lawn with defined pathways.
- 2-3 mature trees and ornamental shrubs.
- A paved driveway or walkway leading to the front door.
- Subtle outdoor lighting fixtures (wall sconces, path lights).

ATMOSPHERE:
- Golden hour daylight (late afternoon). Colour temperature ~5000K.
- Soft, warm shadows. Clear blue sky with light clouds.
- High-quality architectural photography style.

NEGATIVE (avoid): blurriness, text, watermarks, logos, sketch lines, hand-drawn look, dark or moody lighting, oversaturation, floating objects, distorted geometry, unrealistic scale.
`.trim();

// ─────────────────────────────────────────────
//  AI Interior Prompt Generator
// ─────────────────────────────────────────────

/**
 * Generates a prompt for a photorealistic interior perspective view
 * focusing on a specific room and design style.
 */
export const generateInteriorPrompt = (style: DesignStyle = "Modern", roomType: RoomType = "Living Room") => `
TASK: Using this 2D floor plan as reference, generate a photorealistic interior perspective view of the ${roomType} of the house.

RULES (strict):
1) EYE-LEVEL PERSPECTIVE — camera at ~1.6m height, standing inside the ${roomType} shown in the plan.
2) MATCH ROOM PROPORTIONS from the floor plan. Wall positions, doorways, and window placements must be consistent with the layout.
3) SHOW DEPTH — include visible connections to adjacent rooms as seen from the viewpoint.
4) NO TEXT, LABELS, OR ANNOTATIONS anywhere in the image.

DESIGN STYLE: ${style}
- The interior design, furniture, colours, and materials MUST strictly follow the ${style} aesthetic.

INTERIOR DESIGN & MATERIALS:
- Apply wall finishes, flooring, and ceiling details appropriate for a ${style} ${roomType}.
- Lighting fixtures should match the ${style}.

FURNITURE & DECOR (tailored for a ${roomType}):
- Populate the room with furniture typical of a ${roomType} in a ${style} aesthetic.
- Include appropriate decorative elements (rugs, art, plants, accessories) that enhance the ${style}.

WINDOWS & LIGHTING:
- Large windows letting in abundant natural daylight (where indicated by the plan).
- Warm ambient lighting from recessed fixtures and accent lamps.
- Natural light casting soft shadows across furniture and floors.
- Colour temperature ~5500K, bright and welcoming.

ATMOSPHERE:
- The space should feel lived-in, warm, and aspirational.
- Photorealistic quality — like a professional interior design magazine shoot.

NEGATIVE (avoid): blurriness, text, watermarks, logos, sketch lines, hand-drawn look, dark or moody lighting, oversaturation, floating objects, distorted geometry, empty or sterile rooms.
`.trim();

// ─────────────────────────────────────────────
//  Render Mode Configuration
// ─────────────────────────────────────────────

/**
 * Maps each render mode to its display label, description, and
 * AI prompt generator. Used by the Visualizer UI to render the mode selector
 * and by the AI action to select the correct prompt.
 */
export const RENDER_MODES = [
    {
        id: "top-down" as const,
        label: "Top Down",
        description: "Bird's-eye 3D view",
        generatePrompt: () => AURASPACE_RENDER_PROMPT,
    },
    {
        id: "exterior" as const,
        label: "Exterior",
        description: "House exterior model",
        generatePrompt: (style?: DesignStyle) => generateExteriorPrompt(style),
    },
    {
        id: "interior" as const,
        label: "Interior",
        description: "Interior perspective",
        generatePrompt: (style?: DesignStyle, roomType?: RoomType) => generateInteriorPrompt(style, roomType),
    },
] as const;

// ─────────────────────────────────────────────
//  Recommendations Mock Data
// ─────────────────────────────────────────────

export interface ProductRecommendation {
    id: string;
    title: string;
    category: string;
    price: string;
    imageUrl: string;
    styles: DesignStyle[];
    rooms: RoomType[];
}

export const MOCK_RECOMMENDATIONS: ProductRecommendation[] = [
    {
        id: "prod-1",
        title: "Lumina Pendant Light",
        category: "Lighting",
        price: "$249",
        imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=60",
        styles: ["Modern", "Minimalist"],
        rooms: ["Living Room", "Dining Room", "Kitchen"],
    },
    {
        id: "prod-2",
        title: "Oakhaven Velvet Sofa",
        category: "Furniture",
        price: "$1,299",
        imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&auto=format&fit=crop&q=60",
        styles: ["Modern", "Classic"],
        rooms: ["Living Room"],
    },
    {
        id: "prod-3",
        title: "Iron & Wood Coffee Table",
        category: "Furniture",
        price: "$399",
        imageUrl: "https://images.unsplash.com/photo-1532372576444-ea2ba6b29f79?w=500&auto=format&fit=crop&q=60",
        styles: ["Industrial", "Rustic"],
        rooms: ["Living Room"],
    },
    {
        id: "prod-4",
        title: "Minimalist Platform Bed",
        category: "Furniture",
        price: "$899",
        imageUrl: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&auto=format&fit=crop&q=60",
        styles: ["Minimalist", "Modern"],
        rooms: ["Bedroom"],
    },
    {
        id: "prod-5",
        title: "Classic Marble Nightstand",
        category: "Furniture",
        price: "$299",
        imageUrl: "https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=500&auto=format&fit=crop&q=60",
        styles: ["Classic", "Modern"],
        rooms: ["Bedroom"],
    },
    {
        id: "prod-6",
        title: "Matte Black Faucet",
        category: "Fixtures",
        price: "$149",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60",
        styles: ["Industrial", "Minimalist"],
        rooms: ["Bathroom", "Kitchen"],
    },
    {
        id: "prod-7",
        title: "Rustic Farmhouse Table",
        category: "Furniture",
        price: "$1,099",
        imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&auto=format&fit=crop&q=60",
        styles: ["Rustic", "Classic"],
        rooms: ["Dining Room", "Kitchen"],
    },
    {
        id: "prod-8",
        title: "Modern Floating Vanity",
        category: "Fixtures",
        price: "$750",
        imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500&auto=format&fit=crop&q=60",
        styles: ["Modern", "Minimalist"],
        rooms: ["Bathroom"],
    }
];