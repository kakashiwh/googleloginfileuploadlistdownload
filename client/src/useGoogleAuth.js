import { useState, useEffect } from "react";
import { gapi } from "gapi-script";

const useGoogleAuth = (clientId, scope) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const start = () => {
      gapi.client
        .init({
          clientId,
          scope,
        })
        .then(() => {
          if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            setUser(gapi.auth2.getAuthInstance().currentUser.get());
          }
        });
    };

    gapi.load("client:auth2", start);
  }, [clientId, scope]);

  const login = async (googleUser) => {
    const id_token = googleUser.getAuthResponse().id_token;
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    });
    if (!response.ok) {
      throw new Error("Failed to authenticate user.");
    }
    const data = await response.json();
    setUser(data);
  };

  const logout = () => {
    gapi.auth2.getAuthInstance().signOut();
    setUser(null);
  };

  return {
    user,
    login,
    logout,
  };
};

export default useGoogleAuth;