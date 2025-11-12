/**
 * Upload.jsx
 * ----------
 * Purpose:
 * - Let users pick an image file.
 * - Upload it to ImageKit via signed uploads (secure, short-lived creds).
 * - Convert the file to Gemini's inlineData format for multimodal prompts.
 */

 import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload, // SDK method: performs the actual upload to ImageKit
} from "@imagekit/react";
import { useRef } from "react";

// Public key for ImageKit, stored in Vite environment
const PUBLIC_KEY = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

/**
 * authenticator()
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
 * fileToGenerativePart(file)
 * 
 * Reads a File into a base64 data URL, strips the prefix, and returns
 * the Gemini "inlineData" object: { inlineData: { data, mimeType } }.
 * This lets you pass the image directly to the model without hosting.
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
 * 
 * UX: 
 * - Hidden <input type ="file">. clicking the paperclip image opens the picker.
 * - On selection:
 *   1) Mark loading
 *   2) Convert file for Gemini (aiData)
 *   3) Fetch ImageKit auth
 *   4) Upload to ImageKit (dbData)
 *   5) Reset input for next selection
 */
export default function Upload({ setImg }) {
  const ikUploadRef = useRef(null); 
  const fileInputRef = useRef(null);

  // Trigger file picker dialog
  const handlePick = () => fileInputRef.current?.click();

  /**
   * handleUpload()
   *
   * Runs when user picks a file.
   * Manages conversion + auth + upload, updating the parent's image state.
   */
  const handleUpload = async () => {
    const el = fileInputRef.current;

    // Guard: no file chosen
    if (!el || !el.files || el.files.length === 0) {
      alert("Please select a file to upload");
      return;
    }

    const file = el.files[0];

    // Performance tracking metrics
    const uploadMetrics = {
      startTime: Date.now(),
      fileSize: file.size,
      fileName: file.name,
      fileType: file.type,
      fileReadTime: 0,
      authTime: 0,
      uploadTime: 0,
    };

    // Mark as loading; clear any previous error
    setImg((prev) => ({ ...prev, isLoading: true, error: "" }));

    // Step 1: Convert file to Gemini inlineData
    const fileReadStart = Date.now();
    try {
      const aiPart = await fileToGenerativePart(file);
      uploadMetrics.fileReadTime = Date.now() - fileReadStart;
      setImg((prev) => ({ ...prev, aiData: aiPart }));
    } catch (e) {
      console.error("Failed to read file for AI part:", e);
      setImg((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to read file for AI",
      }));
      // Reset input so the same filename can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Step 2: Get ImageKit auth credentials from server
    const authStart = Date.now();
    let auth;
    try {
      auth = await authenticator();
      uploadMetrics.authTime = Date.now() - authStart;
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

    // Step 3: Perform the upload to ImageKit
    const uploadStart = Date.now();
    try {
      const res = await upload({
        publicKey: PUBLIC_KEY, // Client-safe key; server uses the private key to sign
        file,                  // The raw File object
        fileName: file.name,   // Destination name
        token: auth.token,     // Short-lived token from your server
        expire: auth.expire,   // Expiry of the tkoen
        signature: auth.signature, // Signature proves the request is authorized
      });

      uploadMetrics.uploadTime = Date.now() - uploadStart;

      // Calculate performance metrics
      const totalTime = Date.now() - uploadMetrics.startTime;
      const fileSizeMB = uploadMetrics.fileSize / (1024 * 1024);
      const uploadSpeedMBps = fileSizeMB / (uploadMetrics.uploadTime / 1000);

      console.log(
        `%c[IMAGE UPLOAD PERF]`,
        'color: #2196F3; font-weight: bold',
        `\n  File: ${uploadMetrics.fileName} (${fileSizeMB.toFixed(2)} MB)` +
        `\n  File read time: ${uploadMetrics.fileReadTime}ms` +
        `\n  Auth time: ${uploadMetrics.authTime}ms` +
        `\n  Upload time: ${uploadMetrics.uploadTime}ms` +
        `\n  Total time: ${totalTime}ms` +
        `\n  Upload speed: ${uploadSpeedMBps.toFixed(2)} MB/s`
      );

      console.log("Upload response:", res);

      // Success: hand DB/host metadata back to the parent (e.g., url, filePath)
      setImg((prev) => ({
        ...prev,
        isLoading: false,
        dbData: res,
        error: "",
      }));
    } catch (error) {
      // Normalize SDK error surface into friendly message
      let msg = "Upload failed";

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
      // Always clear the file input so subsequent selections fire onChange
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
