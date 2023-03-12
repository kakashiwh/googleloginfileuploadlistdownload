import React, { useState} from "react";
import GoogleLogin from "react-google-login";
import useGoogleAuth from "./useGoogleAuth";


function App() {
  const REACT_PUBLIC_GOOGLE_CLIENT_ID = process.env.REACT_PUBLIC_GOOGLE_CLIENT_ID;
  const { user, login, logout } = useGoogleAuth(REACT_PUBLIC_GOOGLE_CLIENT_ID, "email");
  const [fileList, setFileList] = useState([]);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleGoogleLogin = (googleUser) => {
    login(googleUser).then(() => {
      getFileList();
    });
  };

  const handleGoogleLoginFailure = (error) => {
    console.error(error);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!file) {
      setErrorMessage("Please select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to upload file.");
        }
        setErrorMessage(null);
        return response.json();
      })
      .then(() => {
        getFileList();
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(error.message);
      });
  };

  const getFileList = () => {
    
    fetch("/api/list", {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch file list.");
        }
        setErrorMessage(null);
        return response.json();
      })
      .then((data) => {
        setFileList(data);
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(error.message);
      });
  };

  const handleDownload = (file) => {
    fetch(`/api/list?fileName=${file}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to download file.");
        }
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file;
        a.click();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div>
      {!user ? (
        <GoogleLogin
          clientId={REACT_PUBLIC_GOOGLE_CLIENT_ID}
          buttonText="Sign in with Google"
          onSuccess={handleGoogleLogin}
          onFailure={handleGoogleLoginFailure}
          cookiePolicy={"single_host_origin"}
        />
      ) : (
        <>
          <div>
            <button onClick={logout}>Sign out</button>
          </div>
          <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleFileUpload}>Upload</button>
            {errorMessage && <p>{errorMessage}</p>}
          </div>
          <div>
            <ul>
              {fileList.map((file, index) => (
                <li key={index}>{file} <button onClick={() => handleDownload(file)}>Download</button></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;