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
    # We take a larger slice of the text for big pages
    content_slice = text[:15000] # Slightly reduced to stay under token limits
    
    prompt = f"""
    Perform an exhaustive technical analysis. For large topics, you MUST provide deep detail.
    Return a JSON object:
    {{
      "title": "Short Title (Max 4 words)",
      "executive_summary": "Two long, detailed paragraphs (minimum 100 words total).",
      "technical_stack": [
        {{ "component": "Short Name", "role": "A very detailed 3-sentence explanation." }}
      ],
      "detailed_breakdown": [
        {{ 
          "section_title": "Section Name", 
          "content": "A substantial paragraph explaining complex concepts in depth.",
          "bullets": ["Detailed point 1", "Detailed point 2", "Detailed point 3", "Detailed point 4", "Detailed point 5"]
        }}
      ],
      "use_cases": ["Detailed scenario 1 with context", "Detailed scenario 2 with context"],
      "tldr": "A comprehensive concluding synthesis."
    }}

    Rules: 
    - The 'title' field MUST NOT exceed 4 words.
    - Provide at least 5 'detailed_breakdown' sections for comprehensive coverage.
    
    Content:
    {content_slice}
    """

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a technical architect who writes long-form, detailed documentation."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        return response.choices[0].message.content

    except openai.RateLimitError:
        # FALLBACK: Return a clean JSON that the frontend can display
        return json.dumps({
            "title": "API Rate Limit",
            "executive_summary": "We have temporarily reached the maximum capacity for our AI model. This usually happens when processing very large articles or making too many requests in a short window.",
            "technical_stack": [
                { "component": "Quota Exceeded", "role": "The Groq API (Llama 3.3) has a daily token limit. Your request was blocked to prevent account suspension." }
            ],
            "detailed_breakdown": [
                { 
                    "section_title": "How to fix this?", 
                    "content": "You can try again in approximately 10-15 minutes. To avoid this in the future, try summarizing shorter sections of text or upgrading your API tier.",
                    "bullets": ["Wait 10 minutes", "Use a smaller model (8B)", "Reduce input text length"]
                }
            ],
            "use_cases": ["Try again shortly", "Reduce article length"],
            "tldr": "Rate limit reached. Please wait 10-15 minutes before trying again."
        })
    
    except Exception as e:
        # General Error Fallback
        return json.dumps({
            "title": "Analysis Error",
            "executive_summary": f"An unexpected error occurred: {str(e)}",
            "technical_stack": [],
            "detailed_breakdown": [],
            "use_cases": [],
            "tldr": "Please check the console for more details."
        })
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