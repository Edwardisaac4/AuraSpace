/**
 * visualizer.$id.tsx — Visualizer route for viewing AI-generated renders.
 *
 * This page is reached after a user uploads a floor plan from the Home page.
 * It receives the source image via React Router's `location.state` and either:
 *  a) Displays a pre-existing AI render (if `initialRender` was passed), or
 *  b) Automatically triggers a new AI generation via `generate3DView()`.
 *
 * Supports three render modes:
 *  - Top Down   – Orthographic bird's-eye 3D view (default, auto-generated on mount).
 *  - Exterior   – Photorealistic exterior house model (with style variations).
 *  - Interior   – Eye-level interior perspective (with room and style variations).
 *
 * Each mode/style/room combination is cached so switching between them doesn't 
 * re-trigger the AI generation if a result already exists.
 *
 * URL pattern: /visualizer/:id
 */

import { useLocation, useNavigate, useParams } from "react-router"
import { useState, useEffect, useRef, useMemo } from "react"
import type { ReactNode } from "react"
import { generate3DView } from "../../lib/ai.action";
import { RENDER_MODES, DESIGN_STYLES, ROOM_TYPES, MOCK_RECOMMENDATIONS } from "../../lib/constants";
import { Box, Download, RefreshCcw, Share2, X, Eye, Home, Sofa, ShoppingBag, ArrowRight } from "lucide-react";
import Button from "~/components/ui/Button";


/** Map of icons for each render mode (used in the mode selector bar). */
const MODE_ICONS: Record<RenderMode, ReactNode> = {
    "top-down": <Eye className="mode-icon" />,
    "exterior": <Home className="mode-icon" />,
    "interior": <Sofa className="mode-icon" />,
};

/** Helper to generate a unique cache key based on the current selections. */
const getCacheKey = (mode: RenderMode, style: DesignStyle, room: RoomType) => {
    if (mode === "top-down") return "top-down";
    if (mode === "exterior") return `exterior-${style}`;
    return `interior-${style}-${room}`;
};

const Visualizer = () => {
    // ── Route Params & Navigation ──
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const stateData = (location.state || {}) as {
        initialImage?: string;
        initialRender?: string | null;
        name?: string;
    };

    // ── State & Refs ──

    const hasInitialGenerated = useRef(false);

    /** Cache of rendered images. Keyed by the combination of mode, style, and room. */
    const renderCache = useRef<Record<string, string | null>>({
        "top-down": stateData.initialRender || null,
    });

    // Version tick to force re-render when cache updates
    const [cacheVersion, setCacheVersion] = useState(0);

    const [isProcessing, setIsProcessing] = useState(false);
    const [renderMode, setRenderMode] = useState<RenderMode>("top-down");
    const [selectedStyle, setSelectedStyle] = useState<DesignStyle>("Modern");
    const [selectedRoom, setSelectedRoom] = useState<RoomType>("Living Room");
    
    const [currentImage, setCurrentImage] = useState<string | null>(stateData.initialRender || null);
    const [initialImage, setInitialImage] = useState<string | null>(stateData.initialImage || null);
    const [name, setName] = useState<string>(stateData.name || "Untitled Project");

    const handleBack = () => navigate('/')

    // ── Handlers ──

    const runGeneration = async(mode: RenderMode = renderMode, style: DesignStyle = selectedStyle, room: RoomType = selectedRoom) => {
        if (!initialImage) return;
        try {
            setIsProcessing(true);
            const renderedImage = await generate3DView({
                sourceImage: initialImage,
                renderMode: mode,
                style: style,
                roomType: room
            });

            if (renderedImage) {
                const cacheKey = getCacheKey(mode, style, room);
                renderCache.current[cacheKey] = renderedImage;
                setCacheVersion(v => v + 1);

                // Only update viewport if the user hasn't switched away while loading
                if (mode === renderMode && style === selectedStyle && room === selectedRoom) {
                    setCurrentImage(renderedImage);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    }

    const loadOrGenerate = (mode: RenderMode, style: DesignStyle, room: RoomType) => {
        if (isProcessing) return;
        
        const cacheKey = getCacheKey(mode, style, room);
        const cached = renderCache.current[cacheKey];
        
        if (cached) {
            setCurrentImage(cached);
        } else {
            setCurrentImage(null);
            runGeneration(mode, style, room);
        }
    };

    const handleModeChange = (mode: RenderMode) => {
        if (mode === renderMode || isProcessing) return;
        setRenderMode(mode);
        loadOrGenerate(mode, selectedStyle, selectedRoom);
    };

    const handleStyleChange = (style: DesignStyle) => {
        if (style === selectedStyle || isProcessing) return;
        setSelectedStyle(style);
        loadOrGenerate(renderMode, style, selectedRoom);
    };

    const handleRoomChange = (room: RoomType) => {
        if (room === selectedRoom || isProcessing) return;
        setSelectedRoom(room);
        loadOrGenerate(renderMode, selectedStyle, room);
    };

    // ── Effects ──

    useEffect(() => {
        if(!initialImage || hasInitialGenerated.current) return;
        
        if(stateData.initialRender){
            setCurrentImage(stateData.initialRender);
            renderCache.current["top-down"] = stateData.initialRender;
            hasInitialGenerated.current = true;
            return;
        } else {
            hasInitialGenerated.current = true;
            // Pass explicit literal defaults instead of reading from state
            runGeneration("top-down", "Modern", "Living Room");
        }
    }, [initialImage]);

    useEffect(() => {
        if (!initialImage && id) {
            const stored = sessionStorage.getItem(`auraspace-upload-${id}`);
            if (stored) {
                setInitialImage(stored);
            }
        }
    }, [id, initialImage]);

    // Filter recommendations based on current style and room
    const filteredRecommendations = useMemo(() => {
        return MOCK_RECOMMENDATIONS.filter(item => {
            const matchesStyle = item.styles.includes(selectedStyle);
            const matchesRoom = renderMode === 'interior' ? item.rooms.includes(selectedRoom) : true;
            return matchesStyle && matchesRoom;
        }).slice(0, 4); // Limit to 4 items for UI consistency
    }, [selectedStyle, selectedRoom, renderMode]);


    const activeModeConfig = RENDER_MODES.find((m) => m.id === renderMode);

    // ── Render ──
    return (
        <div className="visualizer">
            {/* ── Top Navigation Bar ── */}
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">AuraSpace</span>
                </div>
                <Button onClick={handleBack} className="exit" size="sm" variant="ghost">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            {/* ── Main Content Area ── */}
            <section className="content">
                <div className="panel">
                    {/* Panel header: project name + action buttons */}
                    <div className="panel-header">
                        <div className="panel-meta">
                            <span className="label">{activeModeConfig?.label || "Source Image"}</span>
                            <h3 className="title">{name}</h3>
                            <p className="note">
                                {renderMode === "top-down" 
                                    ? "Visualizing the future of interior design" 
                                    : `${selectedStyle} ${renderMode === "interior" ? selectedRoom : "Exterior"}`}
                            </p>
                        </div>
                        <div className="panel-actions">
                            <Button size="sm" onClick={() => { }} className="export" disabled={!currentImage}>
                                <Download className="w-4 h-4 mr-3.5"/>Export
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { }}>
                                <Share2 className="w-4 h-4 mr-3.5"/> Share
                            </Button>
                        </div>
                    </div>

                    {/* ── Mode Selector Bar ── */}
                    <div className="mode-bar">
                        {RENDER_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                className={`mode-btn ${renderMode === mode.id ? "active" : ""}`}
                                onClick={() => handleModeChange(mode.id)}
                                disabled={isProcessing}
                                title={mode.description}
                            >
                                {MODE_ICONS[mode.id as RenderMode]}
                                <span className="mode-label">{mode.label}</span>
                                {cacheVersion >= 0 && renderCache.current[getCacheKey(mode.id, selectedStyle, selectedRoom)] && (
                                    <span className="mode-cached" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Sub-Navigation Sliders (Style & Room) ── */}
                    {renderMode !== "top-down" && (
                        <div className="sub-nav">
                            <div className="slider-group">
                                <span className="slider-label">Style:</span>
                                <div className="slider-track">
                                    {DESIGN_STYLES.map(style => (
                                        <button 
                                            key={style}
                                            className={`slider-pill ${selectedStyle === style ? 'active' : ''}`}
                                            onClick={() => handleStyleChange(style)}
                                            disabled={isProcessing}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {renderMode === "interior" && (
                                <div className="slider-group">
                                    <span className="slider-label">Room:</span>
                                    <div className="slider-track">
                                        {ROOM_TYPES.map(room => (
                                            <button 
                                                key={room}
                                                className={`slider-pill ${selectedRoom === room ? 'active' : ''}`}
                                                onClick={() => handleRoomChange(room)}
                                                disabled={isProcessing}
                                            >
                                                {room}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Render Viewport ── */}
                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt={"Rendered View"} className="render-img"/>
                        ) : (
                            <div className="render-placeholder">
                                    {initialImage && <img src={initialImage} alt={"Source Image"} className="render-fallback"/>}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">
                                        Generating {renderMode === 'interior' ? selectedRoom : renderMode === 'exterior' ? 'Exterior' : 'Render'}...
                                    </span>
                                    <span className="subtitle">Applying {selectedStyle} style. This may take a few moments.</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Recommendations Section ── */}
                {renderMode !== "top-down" && filteredRecommendations.length > 0 && (
                    <div className="recommendations-section">
                        <div className="section-header">
                            <div className="title-group">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                <h3>Recommended Fittings & Decor</h3>
                            </div>
                            <p className="subtitle">Curated {selectedStyle.toLowerCase()} pieces to complete your space.</p>
                        </div>
                        
                        <div className="products-grid">
                            {filteredRecommendations.map(product => (
                                <div key={product.id} className="product-card">
                                    <div className="product-image">
                                        <img src={product.imageUrl} alt={product.title} loading="lazy" />
                                        <div className="product-category">{product.category}</div>
                                    </div>
                                    <div className="product-info">
                                        <h4 className="product-title">{product.title}</h4>
                                        <div className="product-meta">
                                            <span className="product-price">{product.price}</span>
                                            <button className="view-btn">
                                                View <ArrowRight className="w-3 h-3 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Visualizer