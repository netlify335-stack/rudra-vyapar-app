const url = "https://rudra-vyapar.vercel.app/api/chat";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "system", content: "System context" },
      { role: "user", content: "Hello" }
    ]
  })
})
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Body:", text))
  .catch(console.error);
