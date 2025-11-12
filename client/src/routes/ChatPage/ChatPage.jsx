import NewPrompt from "../../components/NewPrompt/NewPrompt";
import "./ChatPage.css";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import { ImageKitProvider, Image } from "@imagekit/react"
import { useAuth } from '@clerk/clerk-react'

/**
 * ChatPage Component
 * Displays the full chat interface for a specific conversation.
 * - Fetches chat history dynamically based on the chat ID from the URL.
 * - Renders message history with Markdown formatting.
 * - Supports images via ImageKit integration.
 * - Includes the <NewPrompt /> component for user input.
 */
const ChatPage = () => {
  const { getToken } = useAuth();

  // Extract current route path to derive chat ID (last segment of the URL)
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

  /**
   * Fetch chat history using React Query.
   * - The query key ["chat", chatId] ensures caching is scoped per chat.
   * - Automatically refetches when chatId changes.
   * - Includes Clerk authentication token in Authorization header.
   */
  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const token = await getToken();
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json());
    },
  });

  // Render chat interface and handle loading/error/data states
  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isPending
            ? "Loading..." // show loading state while fetching chat
            : error
            ? "Something went wrong!" // simple error fallback
            : data?.history?.map((message, i) => (
              <>
                {message.img && (
                  <ImageKitProvider urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}>
                    <Image 
                      src={message.img}
                      width="1200"
                      transformation={[{width: 1200}]}
                      loading="lazy"
                      lqip={{active:true, quality:20}}
                      style={{ width: "60%", height: "auto" }}
                    />
                  </ImageKitProvider>
                )}
                <div className={message.role === "user" ? "message user": "message"} key={i}>
                  <Markdown>{message?.parts?.[0]?.text || ""}</Markdown>
                </div>
              </>
            ))}
          {data && <NewPrompt data={data} />}
        </div>
      </div>
    </div>
  );
};

export default ChatPage
