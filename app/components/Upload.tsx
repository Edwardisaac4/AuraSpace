import { CheckCircle2, UploadIcon, ImageIcon } from "lucide-react";
import { useState } from "react"
import { useOutletContext } from "react-router";
import { PROGRESS_STEP, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS } from "../../lib/constants";

interface UploadProps {
  onComplete?: (data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const {isSignedIn} = useOutletContext<AuthContext>();

  const processFile = (file: File) => {
    setFile(file);
    setProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      let currentProgress = 0;
      
      const interval = setInterval(() => {
        currentProgress += PROGRESS_STEP;
        if (currentProgress >= 100) {
          setProgress(100);
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete(base64Data);
          }, REDIRECT_DELAY_MS);
        } else {
          setProgress(currentProgress);
        }
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    
    // Prevent flickering when dragging over child elements
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return;
    }
    
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true); // Ensure it stays true while moving inside
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };


  return (
    <div className="upload">
      {!file ? (
        <div 
          className= {`dropzone ${isDragging ? "dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            className="drop-input" 
            accept=".jpg, .png, .jpeg" 
            disabled={!isSignedIn} 
            onChange={handleChange}
          />
          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={12}/>
            </div>

            <p>
              {isSignedIn ? "Upload image or drag and drop" : "Please sign in to upload"}
            </p>
            
            <p className="help"> JPG, PNG or JPEG (max 50MB) </p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>
            
            <h3>{file.name}</h3>

              <div className="progress">
                <div className="bar" style={{ width: `${progress}%` }} />
                
                <p className="status-text">
                  {progress < 100 ? `Uploading... (${progress}%)` : "Upload complete!"}
                </p>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Upload