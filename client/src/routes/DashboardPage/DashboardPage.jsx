import './DashboardPage.css'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

/**
 * DashboardPage Component
 * Renders main dashboard view where users can start a new chat,
 * analyze images, or get coding help. Integrates with the backend
 * via a POST request to create a new chat session.
 */
const DashboardPage = () => {
  const { getToken } = useAuth();

  // Access React Query client instance to manage cached data
  const queryClient = useQueryClient()

  // React Router hook for client-side navigation
  const navigate = useNavigate();

  /**
   * Define a mutation for creating new chat sessions.
   * Uses React Query's useMutation to handle async state and caching
   */
  const mutation = useMutation({
    // Mutation function - creates a new chat via API
    mutationFn: async (text) => {
      const token = await getToken();
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }), // send user input as JSON payload
      }).then((res) => res.json());
    },

    // On successful mutation:
    // - invalidate cached "userChats to refresh the list"
    // - navigate to the newly created chat page
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      navigate(`/dashboard/chats/${id}`);
    },
  });

  /**
   * Handles form submission for creating a new chat.
   * Prevents default form reload, validates input, and triggers mutation
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value; 
    if (!text) return; // Simple guard clause - ignore empty input

    mutation.mutate(text); // Trigger mutation with user input
  }

  // Render main dashboard layout with options and input form
  return (
    <div className='dashboardPage'>
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>Talk Talk Goose</h1>
        </div>
        <div className="options">
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <input type="text" name="text" placeholder="Ask me anything..." />
          <button>
            <img src="/arrow.png" alt="" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default DashboardPage