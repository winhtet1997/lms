const handleError = (error) => {
  const res = { fieldErrors: {}, message: null };

  // 1. Handle Network/Connection Errors
  if (!error?.response) {
    res.message = "Network error. Please check your connection.";
    return res;
  }

  const { data, status } = error.response;

  // 2. Handle specific Status Codes (Rate limits / Server crashes)
  if (status === 429) {
    res.message = "Too many requests. Please try again later.";
    return res;
  }

  // 3. FIX: Handle Direct Array Response ["OTP request limit exceeded..."]
  if (Array.isArray(data)) {
    res.message = data.join(" ");
    return res;
  }

  // 4. Handle Object Responses
  if (typeof data === "object" && data !== null) {
    const reservedKeys = ["detail", "message", "error", "non_field_errors", "__all__"];
    
    // Check common top-level keys for the main message
    for (const key of reservedKeys) {
      if (data[key]) {
        res.message = Array.isArray(data[key]) ? data[key].join(" ") : data[key];
        break; 
      }
    }

    // Capture specific field errors (e.g., email: "Invalid")
    Object.entries(data).forEach(([field, messages]) => {
      if (!reservedKeys.includes(field)) {
        res.fieldErrors[field] = Array.isArray(messages) ? messages.join(" ") : messages;
      }
    });

    // Promotion: If no main message exists but field errors do, use the first one
    if (!res.message && Object.keys(res.fieldErrors).length > 0) {
      res.message = Object.values(res.fieldErrors)[0]; 
    }
  }

  // 5. Final Fallback (Catch-all)
  if (!res.message) {
    res.message = typeof data === "string" ? data : "An unexpected error occurred.";
  }

  return res;
};

export default handleError;