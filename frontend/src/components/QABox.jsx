export default function QABox({ answer }) {
  if (!answer) return null;

  return (
    <div style={{
      padding: "20px",
      marginTop: "20px",
      background: "#eef7ff",
      borderRadius: "8px",
      border: "1px solid #bcdcff"
    }}>
      <h2>Answer</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "16px" }}>
        {answer}
      </pre>
    </div>
  );
}
