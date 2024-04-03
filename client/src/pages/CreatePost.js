import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import Editor from "../Editor"; // Assuming Editor component handles content editing

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);

  async function createNewPost(ev) {
    ev.preventDefault(); // Prevent default form submission

    const formData = new FormData();
    formData.set("title", title);
    formData.set("summary", summary);
    formData.set("content", content); // Assuming Editor component handles content sanitation
    if (files.length > 0) {
      formData.append("file", files[0]); // Handle multiple files (if needed)
    }

    try {
      const response = await fetch("http://localhost:4000/post", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        setRedirect(true); // Successful creation, trigger redirect
      } else {
        // Handle creation error (e.g., display error message)
        console.error("Error creating post:", await response.text());
      }
    } catch (error) {
      // Handle network errors or other issues
      console.error("Error creating post:", error);
    }
  }

  if (redirect) {
    return <Navigate to="/" />; // Redirect to home upon successful creation
  }

  return (
    <form onSubmit={createNewPost}>
      <input
        type="title"
        placeholder="Title"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
      />
      <input
        type="summary"
        placeholder="Summary"
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
      />
      <input type="file" onChange={(ev) => setFiles(ev.target.files)} />
      <Editor value={content} onChange={setContent} />
      <button style={{ marginTop: "5px" }}>Create Post</button>
    </form>
  );
}
