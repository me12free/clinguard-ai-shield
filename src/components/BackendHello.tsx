import React, { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

const BackendHello: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch(`${apiUrl}/api/hello`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setMessage(data.message))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded mt-4">
      <h2 className="font-bold mb-2">Backend API Test</h2>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
    </div>
  );
};

export default BackendHello;
