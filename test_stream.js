const url = "https://rudra-vyapar.vercel.app/api/chat";

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "hello" }]
  })
})
  .then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    return res.text();
  })
  .then(text => console.log("Body:", text))
  .catch(console.error);
