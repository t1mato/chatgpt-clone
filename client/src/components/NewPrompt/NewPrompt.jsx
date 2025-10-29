import { useEffect, useRef, useState } from "react";
import { Image, ImageKitProvider } from "@imagekit/react";
import Upload from "../Upload/Upload";
import { runModelStream } from "../../lib/gemini";
import "./NewPrompt.css";
import Markdown from "react-markdown";

const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;

const NewPrompt = () => {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
      // Runs after first render, scrolls to endRef element
    }
  }, [question, answer, img.dbData]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form behavior
    if (!input.trim() || isStreaming) return; // Ignore empty input

    setError("");
    // set the submitted question, freeze input
    setQuestion(input);
    setAnswer("");
    setIsStreaming(true);

    try {
      for await (const chunk of runModelStream(input, img.aiData)) {
        setAnswer((prev) => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Something went wrong while streaming.");
    } finally {
      setIsStreaming(false);
      // clear image selection post-turn (keeps UX clean)
      setImg({isLoading: false, error: "", dbData: {}, aiData: {} });
      setInput("");
    }
  };

  return (
    <>
      {/* ADD NEW CHAT */}
      <ImageKitProvider urlEndpoint={urlEndpoint}>
        {/* Provide urlEndpoint to nested <Image /> components */}

        {/* Show uploaded image */}
        {img.isLoading && <div>Loading...</div>}

        {/* Show uploaded image preview */}
        {img.dbData?.filePath && (
          <Image
            src={img.dbData.filePath}
            alt="Uploaded"
            width="1200"
            transformation={[{ width: 1200 }]} // resize on CDN
            loading="lazy"
            style={{ width: "60%", height: "auto" }}
          />
        )}

        {/* User question */}
        {question && <div className="message user">{question}</div>}

        {/* AI answer */}
        {(answer || isStreaming) && (
          <div className="message">
            <Markdown>{answer || ""}</Markdown>
            {isStreaming && <div className="typing">Generating...</div>}
            {error && <div className="error">{error}</div>}
          </div>
        )}

        {/* Scroll anchor */}
        <div className="endChat" ref={endRef}></div>

        {/* Input form */}
        <form className="newForm" onSubmit={handleSubmit}>
          <Upload setImg={setImg} />
          <input id="file" type="file" multiple={false} hidden />
          <input
            type="text"
            value={input}
            placeholder="Ask anything..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
          />
          <button type="submit" disabled={isStreaming}>
            <img src="/arrow.png" alt="Send" />
          </button>
        </form>
      </ImageKitProvider>
    </>
  );
};

export default NewPrompt;
