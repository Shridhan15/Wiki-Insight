import os
import numpy as np
import trafilatura
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import faiss

# Load environment
load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_KEY:
    raise Exception("GROQ_API_KEY not found in .env file")

# Groq Client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_KEY
)

LLM_MODEL = "llama-3.3-70b-versatile"

# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Globals
CHUNKS = []
EMBEDDINGS = None
FAISS_INDEX = None


# -------------------------------------------------------
# 1. Extract Wikipedia text
# -------------------------------------------------------
def extract_wikipedia_text(url: str) -> str:
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        raise Exception("Failed to download webpage")

    text = trafilatura.extract(downloaded)
    if not text:
        raise Exception("Failed to extract clean text")

    return text


# -------------------------------------------------------
# 2. Chunk text
# -------------------------------------------------------
def chunk_text(text, chunk_size=1000, overlap=200):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


# -------------------------------------------------------
# 3. Build FAISS vector store
# -------------------------------------------------------
def build_vector_store(text):
    global CHUNKS, EMBEDDINGS, FAISS_INDEX

    CHUNKS = chunk_text(text)

    EMBEDDINGS = embedder.encode(CHUNKS, convert_to_numpy=True).astype("float32")
    EMBEDDINGS = EMBEDDINGS / np.linalg.norm(EMBEDDINGS, axis=1, keepdims=True)

    dimension = EMBEDDINGS.shape[1]
    FAISS_INDEX = faiss.IndexFlatL2(dimension)
    FAISS_INDEX.add(EMBEDDINGS)


# -------------------------------------------------------
# 4. Retrieve using FAISS
# -------------------------------------------------------
def retrieve(question, top_k=5):
    q_embed = embedder.encode([question], convert_to_numpy=True).astype("float32")
    q_embed = q_embed / np.linalg.norm(q_embed, axis=1, keepdims=True)

    distances, indices = FAISS_INDEX.search(q_embed, top_k)
    return [CHUNKS[i] for i in indices[0]]


# -------------------------------------------------------
# 5. Structure Wikipedia content
# -------------------------------------------------------
def structure_content(text):
    prompt = f"""
Structure the Wikipedia content below into:
1. Title
2. Summary (3–5 lines)
3. 10 Key Highlights
4. Section-wise bullet breakdown
5. Key terms + definitions
6. TLDR (2–3 lines)

Return in clean human-readable text.

Content:
{text[:12000]}
"""

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


# -------------------------------------------------------
# 6. RAG Answering
# -------------------------------------------------------
def answer_with_rag(question):
    context = "\n\n---\n\n".join(retrieve(question))

    prompt = f"""
Answer the question using ONLY the context below.

CONTEXT:
{context}

QUESTION:
{question}

If the answer does not exist in the context, reply:
"I don't know from context."
"""

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content
