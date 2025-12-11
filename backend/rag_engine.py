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

    print("Chunking article...")
    CHUNKS = chunk_text(text)

    print("Creating embeddings...")
    EMBEDDINGS = embedder.encode(CHUNKS, convert_to_numpy=True).astype("float32")

    # Normalize embeddings for better L2 search
    EMBEDDINGS = EMBEDDINGS / np.linalg.norm(EMBEDDINGS, axis=1, keepdims=True)

    print("Building FAISS index...")
    dimension = EMBEDDINGS.shape[1]
    FAISS_INDEX = faiss.IndexFlatL2(dimension)

    FAISS_INDEX.add(EMBEDDINGS)

    print(f"FAISS index built with {len(CHUNKS)} chunks.")


# -------------------------------------------------------
# 4. Retrieve relevant chunks using FAISS
# -------------------------------------------------------
def retrieve(question, top_k=5):
    global FAISS_INDEX, CHUNKS

    # Query embedding
    q_embed = embedder.encode([question], convert_to_numpy=True).astype("float32")

    # Normalize
    q_embed = q_embed / np.linalg.norm(q_embed, axis=1, keepdims=True)

    # Search in FAISS
    distances, indices = FAISS_INDEX.search(q_embed, top_k)

    return [CHUNKS[i] for i in indices[0]]


# -------------------------------------------------------
# 5. Structure Wikipedia content using Groq LLM
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
    context_chunks = retrieve(question)
    context = "\n\n---\n\n".join(context_chunks)

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


# -------------------------------------------------------
# MAIN PROGRAM
# -------------------------------------------------------
if __name__ == "__main__":
    url = input("Enter Wikipedia URL: ").strip()

    print("\nExtracting article...")
    text = extract_wikipedia_text(url)

    print("Building vector store...")
    build_vector_store(text)

    print("\n=== STRUCTURED SUMMARY ===\n")
    print(structure_content(text))

    print("\nYou can now ask questions about this article!")

    while True:
        q = input("\nYour question (or 'exit'): ").strip()
        if q.lower() == "exit":
            break

        print("\nANSWER:")
        print(answer_with_rag(q))
