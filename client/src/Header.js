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

  function logout() {
    fetch('http://localhost:4000/logout', {
      credentials: 'include',
      method: 'POST',
    });
    setUserInfo(null);
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
