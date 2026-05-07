/**
 * Upload.tsx — File upload component with drag-and-drop support.
 *
 * This component handles the entire file upload flow:
 *  1. Presents a dropzone UI where the user can click or drag-and-drop an image.
 *  2. Validates the file type (JPEG, PNG, WebP) and size (max 50MB).
 *  3. Reads the file as a Base64 data-URL using `FileReader`.
 *  4. Simulates an upload progress bar using `setInterval`.
 *  5. Calls `onComplete(base64Data)` when progress reaches 100%.
 *
 * The upload is gated behind authentication — the dropzone is disabled
 * when the user is not signed in.
 */

import { CheckCircle2, UploadIcon, ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react"
import { useOutletContext } from "react-router";
import { PROGRESS_STEP, PROGRESS_INTERVAL_MS, REDIRECT_DELAY_MS } from "../../lib/constants";

/**
 * Props for the Upload component.
 * @property onComplete - Callback fired with the Base64 data-URL once the
 *                        simulated upload completes.
 */
interface UploadProps {
  onComplete?: (data: string) => void;
}

/** Accepted MIME types for uploaded images. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Maximum allowed file size in bytes (50 MB). */
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Upload component — drag-and-drop image uploader with progress bar.
 *
 * @param onComplete - Called with the file's Base64 data-URL after
 *                     the simulated upload animation finishes.
 */
const Upload = ({ onComplete }: UploadProps) => {
  // ── Local State ──
  const [file, setFile] = useState<File | null>(null);           // The selected file object
  const [isDragging, setIsDragging] = useState<boolean>(false);  // Whether a file is being dragged over the dropzone
  const [progress, setProgress] = useState<number>(0);           // Simulated upload progress (0–100)
  const [error, setError] = useState<string | null>(null);       // Validation error message

  // Refs to hold timer IDs so they can be cleaned up on unmount
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull auth state from the root outlet context (upload is disabled when signed out)
  const {isSignedIn} = useOutletContext<AuthContext>();

  /**
   * Cleanup effect — clears any running timers when the component unmounts
   * to prevent memory leaks and state updates on unmounted components.
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Validates the selected file and kicks off the simulated upload process.
   *
   * Steps:
   *  1. Check file type against the allowed MIME types.
   *  2. Check file size against the 50MB limit.
   *  3. Clear any existing timers from a previous upload attempt.
   *  4. Read the file as a Base64 data-URL via `FileReader`.
   *  5. Start a `setInterval` that increments the progress bar by `PROGRESS_STEP`
   *     every `PROGRESS_INTERVAL_MS` milliseconds.
   *  6. When progress hits 100%, clear the interval and call `onComplete`
   *     after a short `REDIRECT_DELAY_MS` pause.
   *
   * @param file - The `File` object selected by the user.
   */
  const processFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 50MB.");
      return;
    }

    // Clear any existing timers from a previous upload
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setFile(file);
    setProgress(0);

    // Read the file contents as a Base64 data-URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      let currentProgress = 0;
      
      // Simulate upload progress with a periodic timer
      intervalRef.current = setInterval(() => {
        currentProgress += PROGRESS_STEP;
        if (currentProgress >= 100) {
          // Upload "complete" — stop the progress bar
          setProgress(100);
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;

          // Wait briefly, then fire the completion callback
          timeoutRef.current = setTimeout(() => {
            if (onComplete) onComplete(base64Data);
            timeoutRef.current = null;
          }, REDIRECT_DELAY_MS);
        } else {
          setProgress(currentProgress);
        }
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(file);
  };

  // ── Drag-and-Drop Event Handlers ──

  /**
   * Fired when a dragged file enters the dropzone area.
   * Sets the `isDragging` visual state (ignored if not signed in).
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  /**
   * Fired when a dragged file leaves the dropzone area.
   * Checks `relatedTarget` to avoid flickering when moving over child elements.
   */
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

  /**
   * Fired continuously while a file is dragged over the dropzone.
   * Keeps `isDragging` true and prevents the browser's default behaviour.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(true); // Ensure it stays true while moving inside
  };

  /**
   * Fired when the user drops a file onto the dropzone.
   * Extracts the first dropped file and passes it to `processFile()`.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) return;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Fired when the user selects a file via the native file input dialog.
   * Extracts the selected file and passes it to `processFile()`.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };


  // ── Render ──
  return (
    <div className="upload">
      {/* Before a file is selected: show the dropzone */}
      {!file ? (
        <div 
          className= {`dropzone ${isDragging ? "dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Hidden native file input — triggered by clicking the dropzone */}
          <input 
            type="file" 
            className="drop-input" 
            accept=".jpg, .png, .jpeg, .webp" 
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
            
            <p className="help"> JPG, PNG or WEBP (max 50MB) </p>
            {/* Inline validation error message */}
            {error && <p className="upload-error">{error}</p>}
          </div>
        </div>
      ) : (
        /* After a file is selected: show the upload progress */
        <div className="upload-status">
          <div className="status-content">
            {/* Icon changes from a file icon to a checkmark when complete */}
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>
            
            <h3>{file.name}</h3>

              {/* Animated progress bar */}
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