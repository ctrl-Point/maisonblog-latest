import { formatISO9075 } from "date-fns";
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faThumbsDown } from "@fortawesome/free-solid-svg-icons";


export default function Post({ _id, title, summary, cover, content, createdAt, author }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [error, setError] = useState(null); // Use for error handling

  async function handleLikeDislike(likeStatus) {
    try {
      const res = await fetch(`https://api.maisondecorco.com/like-dislike/${_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ like: likeStatus }),
      });
      console.log(likeStatus)
      const data = await res.json();
      setLiked(likeStatus);
      setDisliked(!likeStatus); // Set disliked to opposite of liked
      updateLocalStorage(likeStatus); // Update Local Storage
      updateCookie(likeStatus); // Update cookie
    } catch (err) {
      setError(err); // Handle errors here (display message, log, etc.)
    }
  }
  
  const updateLocalStorage = (likeStatus) => {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    let dislikedPosts = JSON.parse(localStorage.getItem('dislikedPosts')) || [];

    if (likeStatus) {
      // Add to likedPosts if not already liked
      if (!likedPosts.includes(_id)) {
        likedPosts.push(_id);
      }
      dislikedPosts = dislikedPosts.filter(item => item !== _id); // Remove from disliked
    } else {
      dislikedPosts.push(_id);
      likedPosts = likedPosts.filter(item => item !== _id); // Remove from liked
    }

    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    localStorage.setItem('dislikedPosts', JSON.stringify(dislikedPosts));
  };

  const updateCookie = (likeStatus) => {
    const cookieName = `post-${_id}-liked`;
    if (likeStatus) {
      document.cookie = `${cookieName}=true;max-age=10800`; // Expires in 1 hour
    } else {
      document.cookie = `${cookieName}=false;max-age=10800`;
    }
  };

  const handleLikeClick = () => {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith(`post-${_id}-liked=`));
    if (!cookieValue || cookieValue.endsWith('=false')) {
      handleLikeDislike(true);
    } else {
      // Display a message indicating already liked
      alert('This post is already liked!');
    }
  };

  const handleDislikeClick = () => {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith(`post-${_id}-liked=`));
    if (!cookieValue || cookieValue.endsWith('=true')) {
      handleLikeDislike(false);
    } else {
      // Display a message indicating already disliked
      alert('This post is already disliked!');
    }
  };

  useEffect(() => {
    const storedLikedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    const storedDislikedPosts = JSON.parse(localStorage.getItem('dislikedPosts')) || [];
    setLiked(storedLikedPosts.includes(_id));
    setDisliked(storedDislikedPosts.includes(_id));
  }, [_id]);

  return (
    <div className="main">
      <div className="post">
        <div className="image">
          <Link to={`/post/${_id}`}>
            <img src={'https://api.maisondecorco.com/' + cover} alt="" />
          </Link>
        </div>
        <div className="texts">
          <Link to={`/post/${_id}`}>
            <h2>{title}</h2>
          </Link>
          <p className="info">
            <a className="author">{author.username}</a>
            <time>{formatISO9075(new Date(createdAt))}</time>
          </p>
          <div className="like-dislike-icons">
            <button onClick={handleLikeClick} className={`like-icon ${liked ? 'liked' : ''}`}>
              <FontAwesomeIcon icon={faThumbsUp} />
            </button>
            <button onClick={handleDislikeClick} className={`dislike-icon ${disliked ? 'disliked' : ''}`}>
              <FontAwesomeIcon icon={faThumbsDown} />
            </button>
          </div>
          <p className="summary">{summary}</p>
        </div>
      </div>
    </div>
  );
}
