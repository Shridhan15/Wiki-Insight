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
import json
import openai # Ensure you have the openai library imported to catch the error

def structure_content(text):
    content_slice = text[:15000] 
    
    prompt = f"""
    Perform a strictly factual analysis of the provided text. 
    
    RULES:
    1. Do NOT invent information. If Technical Stack or Use Cases are not explicitly mentioned or implied by the technology, return null for those fields.
    2. The 'title' must be exactly 4 words or fewer.
    3. Do NOT use corporate filler like 'dedicated contributor' or 'valuable asset' for personal pages.
    4. Return a JSON object with this EXACT structure:

    {{
      "title": "Short Factual Title",
      "executive_summary": "Detailed factual overview based ONLY on text.",
      "technical_stack": [
        {{ "component": "Name", "role": "Purpose" }}
      ], // or null
      "detailed_breakdown": [
        {{ 
          "section_title": "Section Name", 
          "content": "Paragraph",
          "bullets": ["point"]
        }}
      ],
      "use_cases": ["Scenario"], // or null
      "tldr": "Final summary"
    }}

    Content:
    {content_slice}
    """

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a precise data extractor. You prioritize accuracy over length. If data is missing, you return null."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        return response.choices[0].message.content

    except openai.RateLimitError:
        return json.dumps({
            "title": "API Rate Limit",
            "executive_summary": "System capacity reached. Please wait 10-15 minutes.",
            "technical_stack": "null",
            "detailed_breakdown": [],
            "use_cases": "null",
            "tldr": "Limit reached."
        })
    except Exception as e:
        return json.dumps({ "title": "Error", "executive_summary": str(e), "technical_stack": "null", "detailed_breakdown": [], "use_cases": "null", "tldr": "Error" })
# -------------------------------------------------------
# 6. RAG Answering
# -------------------------------------------------------
import openai

def answer_with_rag(question):
    try:
        # 1. Retrieve context
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

        # 2. LLM Call
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except openai.RateLimitError:
        # Professional system status notification (No apology)
        return (
            "SYSTEM NOTICE: Daily API token quota reached. "
            "The model 'llama-3.3-70b-versatile' has exceeded its allocated request limit. "
            "Service will resume once the rate limit window resets (estimated 10-15 minutes)."
        )
    
    except Exception as e:
        # Technical error logging
        return f"TECHNICAL ERROR: Request could not be completed. Details: {str(e)}"