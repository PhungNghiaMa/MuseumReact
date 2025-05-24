import { toastMessage } from "./utils";

// Vite handles environment variables, so we access them via import.meta.env
const BACKEND_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_BACKEND_URL // Use VITE_ prefix
    : import.meta.env.VITE_BACKEND_URL;     // Use VITE_ prefix

// Helper function to check if a value is numeric
const isNumeric = (value) => {
  return !isNaN(value) && isFinite(value);
};

const validateData = (data) => {
  if (!data.title || data.title.length > 40) {
    return "Title is required and must be at most 40 characters.";
  }
  if (!data.description || data.description.length > 200) {
    return "Description is required and must be at most 200 characters.";
  }

  if (data.name.length < 3 || data.name.length > 30) {
    return "Handle must be at least 3 characters and at most 30 characters.";
  }

  if (data.price && !isNumeric(data.price)) { // Corrected condition
    return "Price has to be a number";
  }

  if (data.price > 2000) {
    return "Please keep the price below 2000"; // Corrected price limit.
  }

  return "";
};

export const uploadItem = async (file, title, description, name, price, imgId, museum) => {
  const formData = new FormData();

  const error = validateData({ title, description, price, name });

  if (error !== "") {
    console.log("error: ", error);
    // return toastMessage(error) // Removed for now, see explanation
    throw new Error(error);
  }

  // Append the file to the form data
  formData.append("file", file);

  // Append other form fields
  formData.append("title", title);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("name", name);
  formData.append("img_id", imgId);
  formData.append("museum", museum);

  try {
    const response = await fetch(`${BACKEND_URL}/upload/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get detailed error message.
      throw new Error(`Error: ${response.status} - ${errorText}`); // Include status
    }

    const result = await response.json();
    // console.log('Upload successful:', result)
    return result;
  } catch (error) {
    console.error("Error uploading item:", error);
    throw error; // Re-throw the error to be caught by caller.
  }
};

export async function getMuseumList(museumId) {
  try {
      const response = await fetch(`${BACKEND_URL}/list/${museumId}`, {
          method: 'GET'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch museum list: ${response.status}`);
      }
      return await response.json();
  } catch (error) {
      throw error; // Re-throw to be handled by the component
  }
}
