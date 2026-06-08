const url = "https://rudra-vyapar.vercel.app/api/chat";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{
      role: "user",
      content: "Look at this",
      experimental_attachments: [
        { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", contentType: "image/png" }
      ]
    }]
  })
})
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Body:", text))
  .catch(console.error);
