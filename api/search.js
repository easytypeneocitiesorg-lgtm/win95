export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).send("Missing query");
  }

  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const text = await response.text();

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).send("Search failed");
  }
}
