import React, { useState, useEffect } from "react";
import axios from "axios";
import Dropzone from "react-dropzone";
import GoogleLogin from "react-google-login";
import {gapi} from "gapi-script";

const App = () => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const  client ="467303493899-gaesmk5jhp5aqbd9mtsfv4mpm9unu8cb.apps.googleusercontent.com";
  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: client,
      });
    }

    gapi.load('client:auth2', start);
  }, [client]);

  const fetchData = async () => {
    const result = await axios("/api/files");
    setFiles(result.data);
  };

  const handleDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", currentUser);

    try {
      await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFile(null);
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async (filename,uploader) => {
    if(uploader === currentUser){
    try {
      const response = await axios({
        url: `/api/files/${filename}`,
        method: "GET",
        responseType: "blob",
        params: { email: currentUser.email },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.log(error);
    }
  }else{
    console.log("You are not authorized to download this file.");
  }
  };

 

  const handleLogin = (googleUser) => {
    const id_token = googleUser.getAuthResponse().id_token;
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `id_token=${encodeURIComponent(id_token)}`
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to authenticate user.");
      }
      return response.json();
    })
    .then((data) => {
      setLoggedIn(true);
      setCurrentUser(data.email);
      fetchData();
      console.log(data);
      // handle successful login
    })
    .catch((error) => {
      console.error(error);
      // handle login error
    });
  };

  const handleLogout = () => {
    gapi.auth2.getAuthInstance().signOut().then(() => {
      setLoggedIn(false);
      setCurrentUser(null);
      setFiles([]);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {!loggedIn ? (
        <GoogleLogin
          clientId="467303493899-gaesmk5jhp5aqbd9mtsfv4mpm9unu8cb.apps.googleusercontent.com"
          buttonText="Login with Google"
          onSuccess={handleLogin}
          onFailure={(err) => console.log(err)}
        />
      ) : (
        <>
          <h2>Uploaded files:</h2>
          <button onClick={handleLogout}>Logout</button>
          <ul>
              {files.map((file) => (
              <li key={file.filename}>
                {file.filename} ({file.uploader})
                <button onClick={() => handleDownload(file.filename, file.uploader)}>
                              Download
                </button>
              </li>
              ))}
            </ul>
          <Dropzone onDrop={handleDrop}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {file ? (
                  <p>{file.name}</p>
                ) : (
                  <p>
                    Drag 'n' drop a file here, or click to select a file
                  </p>
                )}
              </div>
            )}
          </Dropzone>
          {file && <button onClick={handleUpload}>Upload</button>}
        </>
      )}
    </div>
  );
};

export default App;