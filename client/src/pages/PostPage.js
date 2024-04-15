import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";
import { Link } from "react-router-dom";
import moment from 'moment';


export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [comments, setComments] = useState(null); // New state variable for comments
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleDeletePost = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;
    try {
      const response = await fetch(`https://api.maisondecorco.com/post/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Error deleting post'); // Throw an error for handling
      }

      navigate("/"); // Redirect to home upon successful deletion
    } catch (error) {
      console.error('Error deleting post:', error);
      // Display an error message to the user
    }

  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          fetch(`https://api.maisondecorco.com/post/${id}`),
          fetch(`https://api.maisondecorco.com/post/${id}/comments`), // New comment fetch
        ]);

        if (!postResponse.ok || !commentsResponse.ok) {
          throw new Error('Error fetching post or comments');
        }

        const postInfo = await postResponse.json();
        const comments = await commentsResponse.json();
        setPostInfo(postInfo);
        setComments(comments); // Add state variable and setter for comments
      } catch (error) {
        console.error("Error fetching post or comments:", error);
      }
    };

    fetchData();
  }, [id]); // Dependency array ensures fetch runs only when `id` changes

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!name.trim() || !comment.trim()) {
      setError("Please enter your name and a comment.");
      return;
    }

    try {
      const response = await fetch(`https://api.maisondecorco.com/comment/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, comment, id }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const newComment = await response.json();

      console.log('Comment submitted successfully:', newComment);

      setName('');
      setComment('');
      setCommentSubmitted(true);
      setError(""); // Reset error state

    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  if (!postInfo || !comments) return "";
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="post-page">
      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}, {moment(postInfo.createdAt).fromNow()}</time>
      <div className="author">by @{postInfo.author.username}</div>
      {userInfo.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit this post
          </Link>
          <button className="delete-btn" onClick={() => handleDeletePost(postInfo._id)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 13.1A4.5 4.5 0 0112 18h0a4.5 4.5 0 01-2.26-7.86L6 6v12h8zM15 3h6v6M15 3l-6 6 6 6z" />
            </svg>
            Delete
          </button>
        </div>
      )}
      <div className="image">
        <img src={`https://api.maisondecorco.com/${postInfo.cover}`} alt=""/>
      </div>
      <div className="content" dangerouslySetInnerHTML={{__html:postInfo.content}} />
      <div className="comments-form">
        <h4>Write Comment</h4>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {commentSubmitted && (
          <div className="comment-notification">
            <p style={{ color: 'green' }}>Comment submitted successfully!</p>
          </div>
        )}
        <form onSubmit={handleSubmitComment}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="Add your comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={512}
          />
          <button type="submit">Post Comment</button>
        </form>
      </div>
      {postInfo && comments && ( // Render comments if both postInfo and comments are available
        <div className="comments-section">
        <h4>Comments ({comments.length})</h4>
        <div className="comment-list">
          {sortedComments.map((comment) => (
            <div key={comment._id} className="media-comment">
              <div className="media-body u-shadow-v18 g-bg-secondary g-pa-30">
                <div className="g-mb-15">
                  <h5 className="h5 g-color-gray-dark-v1 mb-0">{comment.name}</h5>
                  <span className="g-color-gray-dark-v4 g-font-size-12">{moment(comment.createdAt).fromNow()}</span>
                </div>
                <p className="p-comment">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      )}
    </div>
  );
}
