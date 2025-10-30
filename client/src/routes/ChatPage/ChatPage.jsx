import NewPrompt from "../../components/NewPrompt/NewPrompt";
import "./ChatPage.css";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";

const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        credentials: "include",
      }).then((res) => res.json()),
  });

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isPending
            ? "Loading..."
            : error
            ? "Something went wrong!"
            : data?.history?.map((message, i) => (
              <>
              {message.img && (
                <ImageKitProvider urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}>
                  <Image 
                    src={message.img}
                    height="300"
                    width="400"
                    transformation={[{width: 1200}]}
                    loading="lazy"
                    lqip={{active:true, quality:20}}
                  />
                </ImageKitProvider>
              )}
              <div className={message.role === "user" ? "message user": "message"} key={i}>
                <Markdown>{message.parts[0].text}</Markdown>
              </div>
              </>
            ))}
          <NewPrompt />
        </div>
      </div>
    </div>
  );
};

export default ChatPage
