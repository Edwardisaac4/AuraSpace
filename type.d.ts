/**
 * type.d.ts — Global TypeScript type declarations for the AuraSpace application.
 *
 * This file contains all shared interfaces, types, and enums used across
 * the app. Because it is a `.d.ts` file, everything declared here is
 * automatically available in every TypeScript file without explicit imports.
 */

// ─────────────────────────────────────────────
//  Authentication
// ─────────────────────────────────────────────

/**
 * Represents the current authentication state of the user.
 * Stored in React state inside the root `App` component and
 * passed down to child routes via React Router's outlet context.
 */
interface AuthState {
    /** Whether the user is currently signed in via Puter auth. */
    isSignedIn: Boolean;
    /** The authenticated user's display name, or null if not signed in. */
    userName: string | null;
    /** The authenticated user's unique ID (UUID), or null if not signed in. */
    userId: string | null;
}

// ─────────────────────────────────────────────
//  Design / Project Data Models
// ─────────────────────────────────────────────

/**
 * A material that can be applied to surfaces in a design.
 * (Reserved for future use — material picker UI.)
 */
interface Material {
    /** Unique identifier for this material. */
    id: string;
    /** Human-readable material name (e.g. "Oak Hardwood"). */
    name: string;
    /** URL or data-URL of the material's thumbnail preview image. */
    thumbnail: string;
    /** Whether this material is a solid colour or a texture image. */
    type: "color" | "texture";
    /** Which surface category this material applies to. */
    category: "floor" | "wall" | "furniture";
}

/**
 * A single design project created by a user.
 * Each project holds references to a source floor-plan image and
 * an optional AI-rendered 3D visualisation of that floor plan.
 */
interface DesignItem {
    /** Unique project identifier (typically a timestamp string). */
    id: string;
    /** Optional user-given project name (e.g. "Residence 1715000000"). */
    name?: string | null;
    /** Base64 data-URL or hosted URL of the original uploaded floor plan. */
    sourceImage: string;
    /** File-system path where the source image is stored on Puter. */
    sourcePath?: string | null;
    /** Base64 data-URL or hosted URL of the AI-rendered 3D view. */
    renderedImage?: string | null;
    /** File-system path where the rendered image is stored on Puter. */
    renderedPath?: string | null;
    /** Public-facing URL for the project (when shared). */
    publicPath?: string | null;
    /** Unix timestamp (ms) of when the project was created. */
    timestamp: number;
    /** User ID of the project owner. */
    ownerId?: string | null;
    /** Display name of the user who shared this project (if shared). */
    sharedBy?: string | null;
    /** ISO timestamp of when the project was shared. */
    sharedAt?: string | null;
    /** Whether the project is publicly visible. */
    isPublic?: boolean;
}

/**
 * Configuration for a design's surface materials.
 * (Reserved for future use — material customisation feature.)
 */
interface DesignConfig {
    /** Material ID for the floor surface. */
    floor: string;
    /** Material ID for the wall surface. */
    walls: string;
    /** Overall interior design style (e.g. "modern", "minimalist"). */
    style: string;
}

// ─────────────────────────────────────────────
//  Application Status
// ─────────────────────────────────────────────

/**
 * Tracks the overall status of the application's main workflow.
 * Used to drive UI states (spinners, progress bars, etc.).
 */
enum AppStatus {
    /** No operation in progress. */
    IDLE = "IDLE",
    /** A file is being uploaded. */
    UPLOADING = "UPLOADING",
    /** The AI model is generating a 3D render. */
    PROCESSING = "PROCESSING",
    /** Render is complete and ready for display. */
    READY = "READY",
}

// ─────────────────────────────────────────────
//  Render & Visualizer Types
// ─────────────────────────────────────────────

/**
 * Payload emitted when the AI render completes successfully.
 * Contains the rendered image and optional storage path.
 */
type RenderCompletePayload = {
    /** Base64 data-URL or hosted URL of the rendered image. */
    renderedImage: string;
    /** Optional Puter file path where the render was stored. */
    renderedPath?: string;
};

/**
 * Shape of the React Router `location.state` object when
 * navigating to the Visualizer route. Carries the images and
 * metadata needed to initialise the visualiser without a
 * separate data fetch.
 */
type VisualizerLocationState = {
    /** Base64 or URL of the original floor plan image. */
    initialImage?: string;
    /** Pre-existing AI render (skip generation if present). */
    initialRender?: string | null;
    /** Owner user ID (for permission checks). */
    ownerId?: string | null;
    /** Project name to display. */
    name?: string | null;
    /** Who shared this project (if arriving via a shared link). */
    sharedBy?: string | null;
};

// ─────────────────────────────────────────────
//  Component Prop Types
// ─────────────────────────────────────────────

/**
 * Props accepted by the `Visualizer` component.
 * Controls navigation, initial data, and callback hooks for
 * render completion / sharing actions.
 */
interface VisualizerProps {
    /** Navigate back to the home page. */
    onBack: () => void;
    /** The source floor-plan image (base64 or URL). */
    initialImage: string | null;
    /** Callback fired when the AI render finishes. */
    onRenderComplete?: (payload: RenderCompletePayload) => void;
    /** Callback fired when the user clicks "Share". */
    onShare?: (image: string) => Promise<void> | void;
    /** Callback fired when the user clicks "Unshare". */
    onUnshare?: (image: string) => Promise<void> | void;
    /** Display name for the project. */
    projectName?: string;
    /** Unique project identifier. */
    projectId?: string;
    /** Pre-existing AI render to show immediately. */
    initialRender?: string | null;
    /** Whether the project is currently shared publicly. */
    isPublic?: boolean;
    /** Name of the person who shared this project. */
    sharedBy?: string | null;
    /** Whether the current user has permission to un-share. */
    canUnshare?: boolean;
}

/**
 * Props accepted by the `Upload` component.
 */
interface UploadProps {
    /**
     * Callback invoked when the file has been fully read.
     * Receives the file's Base64 data-URL string.
     */
    onComplete: (base64File: string) => Promise<boolean | void> | boolean | void;
    /** Optional CSS class name to apply to the root element. */
    className?: string;
}

/**
 * Props accepted by the reusable `Button` component.
 * Extends the native HTML button attributes so standard
 * props like `onClick`, `disabled`, etc. are inherited.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant. Defaults to "primary". */
    variant?: "primary" | "secondary" | "ghost" | "outline";
    /** Size preset. Defaults to "md". */
    size?: "sm" | "md" | "lg";
    /** If true, the button stretches to fill its container's width. */
    fullWidth?: boolean;
}

/**
 * Props for a generic Card wrapper component.
 * (Reserved for future UI use.)
 */
interface CardProps {
    /** Content rendered inside the card body. */
    children: React.ReactNode;
    /** Optional CSS class name. */
    className?: string;
    /** Optional card title displayed at the top. */
    title?: string;
    /** Optional action element (e.g. a button) rendered in the card header. */
    action?: React.ReactNode;
}

// ─────────────────────────────────────────────
//  Auth Context (passed via React Router Outlet)
// ─────────────────────────────────────────────

/**
 * The shape of the authentication context object that the root `App`
 * component passes to all child routes via `useOutletContext<AuthContext>()`.
 * Includes the current auth state plus action functions to sign in/out.
 */
type AuthContext = {
    /** Whether the user is currently signed in. */
    isSignedIn: boolean;
    /** Display name of the signed-in user. */
    userName: string | null;
    /** UUID of the signed-in user. */
    userId: string | null;
    /** Re-fetches the current user and updates auth state. */
    refreshAuth: () => Promise<void>;
    /** Opens the Puter sign-in flow and refreshes auth state afterward. */
    signIn: () => Promise<void>;
    /** Signs the user out of Puter and refreshes auth state afterward. */
    signOut: () => Promise<void>;
};

/**
 * Props for a modal dialog that prompts the user to authenticate
 * before performing a protected action.
 */
type AuthRequiredModalProps = {
    /** Whether the modal is currently visible. */
    isOpen: boolean;
    /** Handler called when the user confirms (e.g. "Sign In"). */
    onConfirm: () => void;
    /** Handler called when the user dismisses the modal. */
    onCancel: () => void;
    /** Custom modal title (defaults to a generic auth prompt). */
    title?: string;
    /** Custom description text. */
    description?: string;
    /** Custom label for the confirm button. */
    confirmLabel?: string;
};

// ─────────────────────────────────────────────
//  Sharing Types
// ─────────────────────────────────────────────

/** Whether a share operation is adding or removing public access. */
type ShareAction = "share" | "unshare";

/** Current status of a share/unshare operation. */
type ShareStatus = "idle" | "saving" | "done";

// ─────────────────────────────────────────────
//  Hosting & Storage Types
// ─────────────────────────────────────────────

/** Configuration for the Puter hosting subdomain used to serve assets. */
type HostingConfig = { subdomain: string };

/** An asset that has been hosted and is accessible via a public URL. */
type HostedAsset = { url: string };

/**
 * Parameters for `uploadImageHosting()` — stores an image file
 * on the Puter hosting subdomain so it can be served via a public URL.
 */
interface StoreHostedImageParams {
    /** The hosting config containing the subdomain, or null if hosting is unavailable. */
    hosting: HostingConfig | null;
    /** The image URL (base64 data-URL or remote URL) to be uploaded. */
    url: string;
    /** The project ID used to namespace the file path (e.g. "projects/{id}/source.png"). */
    projectId: string;
    /** Whether this is the "source" floor plan or the "rendered" 3D view. */
    label: "source" | "rendered";
}

/**
 * Parameters for `createProject()` — persists a new design project
 * to Puter's key-value store with optional visibility settings.
 */
interface CreateProjectParams {
    /** The DesignItem data to save. */
    item: DesignItem;
    /** Access level: "private" (default) or "public". */
    visibility?: "private" | "public";
}

/**
 * Parameters for `generate3DView()` — sends a source image to the
 * AI model and receives a rendered 3D architectural visualisation.
 */
interface Generate3DViewParams {
    /** Base64 data-URL or hosted URL of the source floor plan image. */
    sourceImage: string;
    /** Optional project ID (for tracking / storage association). */
    projectId?: string | null;
    /** Which render mode to use. Defaults to "top-down". */
    renderMode?: RenderMode;
    /** Optional specific design style to apply (for exterior/interior modes). */
    style?: DesignStyle;
    /** Optional specific room to focus on (for interior mode). */
    roomType?: RoomType;
}

// ─────────────────────────────────────────────
//  Render Modes
// ─────────────────────────────────────────────

/**
 * The available AI render modes.
 *  - "top-down"  – Orthographic bird's-eye 3D view (default).
 *  - "exterior"  – Photorealistic exterior house model.
 *  - "interior"  – Eye-level interior perspective.
 */
type RenderMode = "top-down" | "exterior" | "interior";

/** Available design styles for exterior and interior renders. */
type DesignStyle = "Modern" | "Minimalist" | "Industrial" | "Classic" | "Rustic";

/** Specific room types to focus on during interior renders. */
type RoomType = "Living Room" | "Bedroom" | "Kitchen" | "Bathroom" | "Dining Room";