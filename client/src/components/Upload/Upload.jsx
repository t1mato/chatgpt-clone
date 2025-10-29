/**
 * Upload.jsx
 * ----------
 * Handles image uploads to ImageKit and prepares base64 data
 * for Gemini (AI multimodal input).
 * 
 * Dependencies:
 * - @imagekit/react
 * - React
 * 
 * Expects parent to pass: 
 *   setImg: function to update image state in parent component
 */

 import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload, // Upload function that sends files to ImageKit CDN
} from "@imagekit/react";
import { useRef } from "react";

// Public key for ImageKit, stored in Vite environment
const PUBLIC_KEY = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

/**
 * Authenticator function
 * ----------------------
 * Fetches short-lived credentials (token, expire, signature)
 * from your Express backend endpoint for secure uploads.
 */
const authenticator = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/upload");

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    // server returns JSON: { token, expire, signature }
    const { token, expire, signature } = await response.json();
    return { token, expire, signature };
  } catch (err) {
    console.error("Authentication error:", err);
    throw new Error("Authentication request failed");
  }
};

/**
 * Converts a File into a format suitable for Gemini multimodal API.
 * Reads the file as a base64 string, returns an inlineData object.
 */
const fileToGenerativePart = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result ? String(reader.result) : "";
      const base64 = result.includes(",") ? result.split(",")[1] : "";
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Upload Component
 * ----------------
 * - Allows the user to select an image file.
 * - Uploads the file to ImageKit using signed upload authentication.
 * - Sends base64 image data to the parent for Gemini API use.
 */
export default function Upload({ setImg }) {
  const ikUploadRef = useRef(null);
  const fileInputRef = useRef(null);

  // Trigger file picker dialog
  const handlePick = () => fileInputRef.current?.click();

  // Handles file selection and upload process
  const handleUpload = async () => {
    const el = fileInputRef.current;

    if (!el || !el.files || el.files.length === 0) {
      alert("Please select a file to upload");
      return;
    }

    const file = el.files[0];

    // Mark as loading
    setImg((prev) => ({ ...prev, isLoading: true, error: "" }));

    // Convert file to Gemini's required inlineData format
    try {
      const aiPart = await fileToGenerativePart(file);
      setImg((prev) => ({ ...prev, aiData: aiPart }));
    } catch (e) {
      console.error("Failed to read file for AI part:", e);
      setImg((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to read file for AI",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Get ImageKit auth credentials
    let auth;
    try {
      auth = await authenticator();
    } catch (e) {
      console.error("Failed to authenticate for upload:", e);
      setImg((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to authenticate for upload",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Perform the upload
    try {
      const res = await upload({
        publicKey: PUBLIC_KEY, // identifies ImageKit account
        file, // file chosen by user
        fileName: file.name, // desired name at destination
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
      });

      console.log("Upload response:", res);

      // Update parent state with uploaded file data
      setImg((prev) => ({
        ...prev,
        isLoading: false,
        dbData: res,
        error: "",
      }));
    } catch (error) {
      let msg = "Upload failed";

      // Handle specific ImageKit error types
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
        msg = "Upload was aborted";
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
        msg = `Invalid request: ${error.message}`;
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
        msg = "Network error while uploading";
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
        msg = "Server error while uploading";
      } else {
        console.error("Upload error:", error);
        msg = error?.message || msg;
      }

      setImg((prev) => ({ ...prev, isLoading: false, error: msg }));
    } finally {
      // Reset input for next upload
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ position: "absolute", left: "-9999px" }}
      />

      {/* Upload trigger (clickable image icon) */}
      <label>
        <img
          src="/attachment.png"
          onClick={handlePick}
          ref={ikUploadRef}
          role="button"
          alt="Upload attachment"
          title="Upload image"
        />
      </label>
    </>
  );
}
