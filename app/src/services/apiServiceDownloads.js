import axios from "axios";

/**
 * Global service to download files from Wello API
 *
 * @param {string} baseUrl - API base URL (example: https://servicedeskapi.wello.solutions)
 * @param {string} authKey - User auth key
 * @param {string[]} ids - Array of file IDs to download
 * @param {string} [fallbackName="download.zip"] - Default filename if no name can be resolved
 * @param {string} [fileType="application/zip"] - Expected MIME type
 */
export const downloadFiles = async (
  baseUrl,
  authKey,
  ids,
  fallbackName = "download.zip",
  fileType = "application/zip"
) => {
  if (!ids || ids.length === 0) {
    console.warn("No file IDs provided for download.");
    return;
  }

  const endpoint = `${baseUrl}api/DbFileView/download/?token=${encodeURIComponent(authKey)}`;

  // API requires format: ['id1', 'id2']
  const paraString = `[${ids.map((id) => `'${id}'`).join(", ")}]`;

  const formData = new URLSearchParams();
  formData.append("paraString", paraString);

  try {
    const response = await axios.post(endpoint, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      responseType: "blob", // important for file downloads
    });

    if (!response.data || response.data.size === 0) {
      console.warn("Empty file response — skipping download.");
      return;
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const filename = ids.length > 1
      ? `files_${timestamp}.zip`
      : fallbackName.replace(/(\.[^.]+)?$/, `_${timestamp}$1`);

    // Trigger download
    const blob = new Blob([response.data], { type: fileType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};