
const BASE_URL = "http://127.0.0.1:8000";


export async function loadArticle(url) {
    const res = await fetch(`${BASE_URL}/api/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ url }),
    });

    if (!res.ok) {
        console.error("LoadArticle Error:", res.status, res.statusText);
        throw new Error("Backend request failed");
    }

    return res.json();
}

export async function askQuestion(question) {
    const res = await fetch(`${BASE_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ question }),
    });

    if (!res.ok) {
        console.error("Ask Error:", res.status, res.statusText);
        throw new Error("Backend request failed");
    }

    return res.json();
}
