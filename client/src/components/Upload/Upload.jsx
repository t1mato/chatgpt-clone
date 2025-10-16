import {
    ImageKitAbortError, // Error classes
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload, // function that sends files to ImageKit's CDN (Content Delivery Network)
  } from "@imagekit/react";
  import { useRef } from "react"; // useRef to hold reference in upload input
  
  // Read your public key from Vite env (client-side)
  const PUBLIC_KEY = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;
  
  // Auth function calls your Express endpoint, ImageKit uses signed upload flow for security
  const authenticator = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/upload");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed with status ${response.status}: ${errorText}`);
      }
      // server returns: { token, expire, signature }
      const { token, expire, signature } = await response.json();
      return { token, expire, signature }; // computes short lived credentials, browser requests it from endpoint
    } catch (err) {
      console.error("Authentication error:", err);
      throw new Error("Authentication request failed");
    }
  };
  
  // Core logic
  export default function Upload({ setImg }) {
    const ikUploadRef = useRef(null);
    const fileInputRef = useRef(null); // points to null so we can read the initial selected file
    const handlePick = () => fileInputRef.current?.click();
  
    const handleUpload = async () => {
      const el = fileInputRef.current;
      if (!el || !el.files || el.files.length === 0) { // Validate file input exists or is selected
        alert("Please select a file to upload");
        return;
      }

      setImg((prev) => ({...prev, isLoading: true, error: ""})); // ...prev makes new object including data from the previous data

      const file = el.files[0];
      let auth;
      try { // must fetch before calling upload to ensure authentication
        auth = await authenticator(); // { token, expire, signature }
      } catch (e) {
        console.error("Failed to authenticate for upload:", e);
        setImg((prev) => ({ ...prev, isLoading: false, error: "Failed to authenticate for upload" })); // added: surface auth error
        // added: reset input so re-selecting the same file still fires onChange
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
  
      try {
        const res = await upload({
          publicKey: PUBLIC_KEY, // identifies ImageKit account
          file, // file chosen by user
          fileName: file.name, // desired name at destination
          token: auth.token, // token, expire, signature: short-lived credentials from server
          expire: auth.expire,
          signature: auth.signature,
        });
        console.log("Upload response:", res); // returns response from ImageKit with metadata

        setImg((prev) => ({ // update parent's state: stop loading, stash entire res as dbData, clear error
            ...prev,
            isLoading: false,
            dbData: res,
            error: "",
        }));

      } catch (error) {
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
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          style={{ position: "absolute", left: "-9999px" }}
        />
        <label>
          <img
            src="/attachment.png"
            onClick={handlePick}
            ref={ikUploadRef}
            role="button"
            alt=""
          />
        </label>
      </>
    );
  }
