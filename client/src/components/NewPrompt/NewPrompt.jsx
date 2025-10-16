import { useEffect, useRef, useState } from 'react';
import { Image, ImageKitProvider } from '@imagekit/react';
import Upload from '../Upload/Upload';
import './NewPrompt.css'

const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;

const NewPrompt = () => {

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
  }, []);

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
          style={{ width: "100%", height: "auto" }}

        />
      )}

      <div className="endChat" ref={endRef}></div> {/* This is the element the effect scrolls to */}

        <form className="newForm">
            <Upload setImg={setImg} />
            <input id="file" type="file" multiple={false} hidden />
            <input type="text" placeholder="Ask anything..." />
            <button>
                <img src="/arrow.png" alt="" />
            </button>
        </form>
    </ImageKitProvider>
    </>
  )
}

export default NewPrompt