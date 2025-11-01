import { Link } from 'react-router-dom'
import './ChatList.css'
import { useQuery } from '@tanstack/react-query'

/**
 * ChatList Component
 * Displays the user's chat history and quick navigation links
 * within the dashboard sidebar. Fetches recent chats using React Query.
 */
const ChatList = () => {

  /**
   * Fetch user's chat list from the backend API.
   * - Uses React Query to handle async data fetching and caching.
   * - Automatically re-fetches data when the query key changes or becomes invalidated.
   */
  const { isPending, error, data } = useQuery({
    queryKey: ['userChats'], // uniquely identifies this query in the cache
    queryFn: () => 
      fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
        credentials: "include", // include cookies for authentication
      }).then((res) =>
        res.json(),
      ),
  });

  // Render the chat list sidebar UI
  return (
    <div className='chatList'>
        <span className='title'>DASHBOARD</span>
        <Link to="/dashboard">Create a new Chat</Link>
        <Link to="/">Explore Talk Talk Goose</Link>
        <Link to="/">Contact</Link>
        <hr />
        <span className="title">RECENT CHATS</span>
        <div className="list">
            {isPending 
              ? "Loading..." 
              : error 
              ? "Something went wrong!" 
              : data?.map((chat) => (
                <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
                  {chat.title}
                </Link>
            ))}
        </div>
        <hr />
        <div className="upgrade">
            <img src="/logo.png" alt="" />
            <div className="texts">
                <span>Upgrade to Talk Talk Goose Pro</span>
                <span>Get unlimited access to all features</span>
            </div>
        </div>
    </div>
  )
}

export default ChatList