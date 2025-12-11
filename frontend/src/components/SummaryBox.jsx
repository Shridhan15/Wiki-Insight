export default function SummaryBox({ summary }) {
  if (!summary) return null;

  return (
    <div style={{
      padding: "20px",
      marginTop: "20px",
      background: "#f9f9f9",
      borderRadius: "8px",
      border: "1px solid #ddd"
    }}>
      <h2>Structured Summary</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "16px" }}>
        {summary}
      </pre>
    </div>
  );
}
