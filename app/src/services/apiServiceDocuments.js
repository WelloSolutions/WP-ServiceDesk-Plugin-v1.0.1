import axios from "axios";

const WELLO_API_URL =
  process.env.REACT_APP_WELLO_API_URL || "https://servicedeskapi.wello.solutions";

/**
 * Generic API request utility for Wello API
 *
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} authKey - User auth key
 * @param {any} data - Request body (JSON, formData, raw string)
 * @param {string} [accept="application/json"] - Expected response type
 * @param {string} [contentType] - Override Content-Type (default: auto-detect)
 * @returns {Promise<any>} - JSON object or Blob depending on response
 */
export const fetchDocuments = async (
  endpoint,
  method = "GET",
  authKey = JSON.parse(localStorage.getItem("auth"))?.authKey,
  data = null,
  accept = "application/json",
  contentType
) => {
  if (!WELLO_API_URL) {
    throw new Error("WELLO_API_URL is not defined in environment variables.");
  }
  if (!authKey) {
    throw new Error("Authorization key is missing.");
  }

  // Detect response type
  const isJson = accept.includes("json");
  const responseType = isJson ? "json" : "blob";

  // Auto Content-Type
  let headers = {
    Authorization: `Basic ${authKey}`,
    Accept: accept,
  };

  if (method !== "GET") {
    if (contentType) {
      headers["Content-Type"] = contentType;
    } else if (typeof data === "string" && data.includes("paraString=[")) {
      // special case for paraString array
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      headers["Content-Type"] = "application/json";
    }
  }

  const config = {
    url: `${WELLO_API_URL}/${endpoint}`,
    method,
    headers,
    ...(method !== "GET" && { data }),
    responseType,
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        message: error.response.data || error.message,
      });
    } else {
      console.error("Request Error:", error.message);
    }
    throw error;
  }
};