import { useState } from "react";
import { loadArticle, askQuestion } from "../api";
import SummaryBox from "../components/SummaryBox";
import QABox from "../components/QABox";
import Loader from "../components/Loader";

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLoad() {
    setLoading(true);
    setAnswer("");
    const data = await loadArticle(url);
    setSummary(data.summary);
    setLoading(false);
  }

  async function handleAsk() {
    setLoading(true);
    const data = await askQuestion(question);
    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      <h1>Wikipedia RAG Explorer</h1>

      <div>
        <input
          type="text"
          placeholder="Enter Wikipedia URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "80%",
            padding: "10px",
            marginRight: "10px",
            fontSize: "16px"
          }}
        />
        <button onClick={handleLoad} style={{ padding: "10px 20px" }}>
          Load
        </button>
      </div>

      {loading && <Loader />}

      <SummaryBox summary={summary} />

      {summary && (
        <>
          <div style={{ marginTop: "30px" }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                width: "80%",
                padding: "10px",
                marginRight: "10px",
                fontSize: "16px"
              }}
            />
            <button onClick={handleAsk} style={{ padding: "10px 20px" }}>
              Ask
            </button>
          </div>

          <QABox answer={answer} />
        </>
      )}
    </div>
  );
}
