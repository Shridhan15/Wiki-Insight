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
        raise Exception("Failed to download webpage. Check the URL.")

    # Removed 'extract_formatted' and used 'include_formatting' if supported, 
    # but 'favor_recall' and 'include_tables' are the most critical for your needs.
    text = trafilatura.extract(
        downloaded, 
        favor_recall=True, 
        include_tables=True,
        include_images=False,
        include_links=False,
        # include_formatting=True  # Optional: use this instead if you want bold/italics markers
    )
    
    if not text:
        raise Exception("Failed to extract clean text from the page.")

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
    # Expanded context slice to capture more of the page
    content_slice = text[:18000] 
    
    prompt = f"""
    Perform a COMPREHENSIVE technical and topical analysis of the provided text.
    
    INSTRUCTIONS:
    1. VISITATION: You must identify every major heading and unique topic in the text.
    2. DATA INTEGRITY: Do NOT invent achievements or technical details. If 'technical_stack' or 'use_cases' are not present, return null.
    3. SCOPE: Ensure 'detailed_breakdown' captures the full breadth of the article, from introduction to final sections.
    4. FORMAT: Return a JSON object with this EXACT structure:

    {{
      "title": "Factual Title (Max 4 words)",
      "executive_summary": "A deep, 2-paragraph summary covering all primary themes.",
      "technical_stack": [
        {{ "component": "Name", "role": "Factual role" }}
      ], 
      "detailed_breakdown": [
        {{ 
          "section_title": "Section Name", 
          "content": "Comprehensive paragraph summarizing this specific area of the text.",
          "bullets": ["Crucial detail 1", "Crucial detail 2", "Crucial detail 3"]
        }}
      ],
      "use_cases": ["Factual application scenario"], 
      "tldr": "High-level synthesis of the entire page."
    }}

    Content:
    {content_slice}
    """

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a high-recall information extractor. Your goal is to ensure no major sub-topic from the source text is ignored. You use a professional, neutral tone."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        return response.choices[0].message.content

    except openai.RateLimitError:
        return json.dumps({
            "title": "System Rate Limit",
            "executive_summary": "SYSTEM NOTICE: Daily API token quota reached. Analysis is temporarily paused.",
            "technical_stack": None, # Use None (null in JSON) instead of "null" string
            "detailed_breakdown": [{"section_title": "Notice", "content": "Please wait 10-15 minutes.", "bullets": []}],
            "use_cases": None,
            "tldr": "Limit reached."
        })
    except Exception as e:
        return json.dumps({ 
            "title": "Analysis Error", 
            "executive_summary": f"Technical Error: {str(e)}", 
            "technical_stack": None, 
            "detailed_breakdown": [], 
            "use_cases": None, 
            "tldr": "Error" 
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