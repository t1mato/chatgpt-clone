import { useEffect, useRef, useState } from 'react';
import { Image, ImageKitProvider } from '@imagekit/react';
import Upload from '../Upload/Upload';
import { runModel } from '../../lib/gemini'
import './NewPrompt.css'
import Markdown from "react-markdown";

const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;

const NewPrompt = () => {
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [img, setImg] = useState({
    isLoading: false,
    error:"",
    dbData:{}
  })
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({behavior:"smooth"}); // Runs after first render, scrolls to endRef element
    }
  }, [question, answer, img.dbData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // set the submitted question
    setQuestion(input);

    // call the AI model
    const response = await runModel(input);
    console.log("AI says:", response);

    // set the answer and clear the input
    setAnswer(response);
    setInput("");
  };

  return (
    <>
    {/* ADD NEW CHAT */}
    <ImageKitProvider urlEndpoint={urlEndpoint}> {/* Puts urlEndpoint into React context so any nested <Image /> can build full URL without needing to pass endpoint all the time */}
      {/* Show uploaded image */}
      {img.isLoading && <div className=''>Loading...</div>} {/* Shows loading message while image is uploading */}

      {img.dbData?.filePath && (
        <Image
          src={img.dbData.filePath}
          alt="Uploaded"
          width="1200"
          transformation={[{ width: 1200 }]}   // 👈 resize image on CDN
          loading="lazy"
          style={{ width: "60%", height: "auto" }}

        />
      )}
      
      {question && <div className='message user'>{question}</div>}
      {answer && <div className='message'><Markdown>{answer}</Markdown></div>}

      <div className="endChat" ref={endRef}></div> {/* This is the element the effect scrolls to */}

      <form className="newForm" onSubmit={handleSubmit}>
          <Upload setImg={setImg} />
          <input id="file" type="file" multiple={false} hidden />
          <input type="text" value={input} placeholder="Ask anything..." onChange={(e) => setInput(e.target.value)} />
          <button>
              <img src="/arrow.png" alt="" />
          </button>
      </form>
    </ImageKitProvider>
    </>
  )
}

export default NewPrompt