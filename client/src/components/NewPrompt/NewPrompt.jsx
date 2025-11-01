import { useEffect, useRef, useState } from "react";
import { Image, ImageKitProvider } from "@imagekit/react";
import Upload from "../Upload/Upload";
import { runModelStream } from "../../lib/gemini";
import "./NewPrompt.css";
import Markdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;

const NewPrompt = ({ data }) => {
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
  const formRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data, question, answer, img.dbData]);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["chat", data._id] })
        .then(() => {
          formRef.current?.reset?.();
          setQuestion("");
          setAnswer("");
          setImg({ isLoading: false, error: "", dbData: {}, aiData: {} });
        });
      navigate(`/dashboard/chats/${data?._id}`);
    },
    onError: (err) => {
      console.log(err);
    },
  });

  // --- NEW: unified add() like the commented version, but using runModelStream ---
  const add = async (text, isInitial) => {
    if (!text?.trim() || isStreaming) return;

    // Mirror original behavior: only set question for non-initial calls
    if (!isInitial) setQuestion(text);
    setAnswer("");
    setError("");
    setIsStreaming(true);

    try {
      let accumulated = "";
      for await (const chunk of runModelStream(text, img.aiData)) {
        accumulated += chunk;
        setAnswer(accumulated);
      }
      // Persist this turn after the stream finishes
      mutation.mutate();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Something went wrong while streaming.");
    } finally {
      setIsStreaming(false);
      setInput(""); // clear input after a turn
    }
  };
  // ------------------------------------------------------------------------------

  // --- NEW: auto-run the very first message of a brand-new chat (like your comment) ---
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    const firstUserOnly =
      Array.isArray(data?.history) &&
      data.history.length === 1 &&
      data.history[0]?.role === "user" &&
      data.history[0]?.parts?.[0]?.text;

    if (firstUserOnly) {
      add(data.history[0].parts[0].text, true);
    }
    hasRun.current = true;
  }, [data]); // run once when chat data is available
  // ------------------------------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Route through add() so all streaming & persistence happens in one place
    await add(input, false);
  };

  return (
    <>
      <ImageKitProvider urlEndpoint={urlEndpoint}>
        {img.isLoading && <div>Loading...</div>}

        {img.dbData?.filePath && (
          <Image
            src={img.dbData.filePath}
            alt="Uploaded"
            width="1200"
            transformation={[{ width: 1200 }]}
            loading="lazy"
            style={{ width: "60%", height: "auto" }}
          />
        )}

        {question && <div className="message user">{question}</div>}

        {(answer || isStreaming) && (
          <div className="message">
            <Markdown>{answer || ""}</Markdown>
            {isStreaming && <div className="typing">Generating...</div>}
            {error && <div className="error">{error}</div>}
          </div>
        )}

        <div className="endChat" ref={endRef}></div>

        <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
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
