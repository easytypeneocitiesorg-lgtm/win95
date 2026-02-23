export default async function handler(req, res) {
  let { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    let contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      return res.status(200).send(Buffer.from(buffer));
    }

    let html = await response.text();

    // Rewrite links and forms
    html = html.replace(/(href|src)=["'](.*?)["']/gi, (match, attr, link) => {
      if (link.startsWith("http") || link.startsWith("//")) {
        return `${attr}="/api/proxy?url=${encodeURIComponent(link)}"`;
      }
      if (link.startsWith("/")) {
        const origin = new URL(url).origin;
        return `${attr}="/api/proxy?url=${encodeURIComponent(origin + link)}"`;
      }
      return match;
    });

    html = html.replace(/<form(.*?)action=["'](.*?)["']/gi, (match, rest, action) => {
      let newAction = action;
      if (!action.startsWith("http")) {
        const origin = new URL(url).origin;
        newAction = origin + action;
      }
      return `<form${rest}action="/api/proxy?url=${encodeURIComponent(newAction)}"`;
    });

    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "");
    res.status(200).send(html);

  } catch (err) {
    res.status(500).send("Proxy failed");
  }
}
