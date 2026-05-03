import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'

const Visualizer = () => {
  const { id } = useParams();
  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const stored = sessionStorage.getItem(`auraspace-upload-${id}`);
    if (stored) {
      setImageData(stored);
    }
  }, [id]);

  if (!imageData) {
    return (
      <div className="visualizer-route loading">
        <p>No image found. Please upload an image first.</p>
      </div>
    );
  }

  return (
    <div className="visualizer-route">
      <img src={imageData} alt="Uploaded reference" />
    </div>
  )
}

export default Visualizer