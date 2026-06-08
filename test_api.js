fetch("https://rudra-vyapar.vercel.app/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ id: "1", role: "user", content: "test" }]
  })
}).then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}).catch(console.error);
