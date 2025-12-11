from fastapi import FastAPI
from pydantic import BaseModel
from rag_engine import extract_wikipedia_text, build_vector_store, structure_content, answer_with_rag
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


class URLRequest(BaseModel):
    url: str

class QuestionRequest(BaseModel):
    question: str

@app.post("/api/load")
def load_article(req: URLRequest):
    text = extract_wikipedia_text(req.url)
    build_vector_store(text)
    summary = structure_content(text)
    return {"summary": summary}

@app.post("/api/ask")
def ask_question(req: QuestionRequest):
    answer = answer_with_rag(req.question)
    return {"answer": answer}
