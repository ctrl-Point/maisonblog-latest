import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import logo from './logo.png';

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  console.log("Path: ", isAdminPath)

  useEffect(() => {
    fetch('http://localhost:4000/profile', {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  async function logout() {
    try {
      const response = await fetch('http://localhost:4000/logout', {
        credentials: 'include',
        method: 'POST',
      });
  
      if (response.ok) {
        // Clear user information from state
        setUserInfo(null);
  
        // Redirect to the homepage
        window.location.href = '/';
      } else {
        // Handle potential errors during logout
        console.error('Error logging out:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  

  const username = userInfo?.username;

  return (
    <header>
      <Link to="/" className="logo">
      <img src={logo} alt="MyBlog Logo" className="logo" />
      </Link>
      <nav>
        {username && (
          <>
            <Link to="/create">Create new post</Link>
            <a onClick={logout}>Logout ({username})</a>
          </>
        )}
        {!username && isAdminPath && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
        )}
      </nav>
    </header>
  );
}
