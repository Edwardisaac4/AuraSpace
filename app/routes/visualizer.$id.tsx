import { useLocation, useParams } from "react-router"
import { useState, useEffect } from "react"


const Visualizer = () => {
    const { id } = useParams();
    const location = useLocation();
    const stateData = (location.state || {}) as {
        initialImage?: string;
        initialRender?: string | null;
        name?: string;
    };

    const [initialImage, setInitialImage] = useState<string | null>(stateData.initialImage || null);
    const [name, setName] = useState<string>(stateData.name || "Untitled Project");

    // Fallback: try sessionStorage if location.state is missing (direct nav / refresh)
    useEffect(() => {
        if (!initialImage && id) {
            const stored = sessionStorage.getItem(`auraspace-upload-${id}`);
            if (stored) {
                setInitialImage(stored);
            }
        }
    }, [id, initialImage]);

    return (
        <section>
            <h1>{name}</h1>

            <div className="visualizer">
                {initialImage ? (
                    <div className="image-container">
                        <h2>Source Image</h2>
                        <img src={initialImage} alt="Source" />
                    </div>
                ) : (
                    <div className="visualizer-route loading">
                        <p>No image found. Please upload an image first.</p>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Visualizer