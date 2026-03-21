import os
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ─ 1. Parse PDF 
def parse_pdf(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    if not text.strip():
        raise ValueError("Could not extract text. PDF may be scanned.")
    return text

# ─ 2. Chunk Text 
def chunk_text(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    return splitter.create_documents([text])

# ─ 3. Embed & Store 
def create_vectorstore(chunks, session_id):
    embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY
    )
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=f"./db/{session_id}"
    )
    return vectorstore

# ─ 4. Load Existing Vectorstore 
def load_vectorstore(session_id):
    embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY
    )
    return Chroma(
        persist_directory=f"./db/{session_id}",
        embedding_function=embeddings
    )

# ─ 5. QA Chain
def get_qa_chain(vectorstore):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.3
    )

    prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a financial document assistant helping users understand 
    complex financial documents in plain English.
    
    Use the following context from the document to answer the question.
    If the answer is not in the context, say 'I could not find this information 
    in the uploaded document.'
    
    Always structure your response like this:

    ### [Short Answer Header]
    A one-line direct answer to the question.

    **Key Points:**
    • Point one
    • Point two
    • Point three (only include points that are relevant)

    **From the Document:**
    Cite the specific section or clause where you found this information.

    Keep answers clear, concise and in plain English. Avoid legal jargon.
    
    Context: {context}"""),
    ("human", "{input}")
])

    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(
        vectorstore.as_retriever(search_kwargs={"k": 3}),
        document_chain
    )
    return retrieval_chain

# ─ 6. Process Document
def process_document(file_path, session_id):
    text = parse_pdf(file_path)
    chunks = chunk_text(text)
    create_vectorstore(chunks, session_id)
    return len(chunks)

# ─7. Answer Question
def answer_question(session_id, question):
    vectorstore = load_vectorstore(session_id)
    chain = get_qa_chain(vectorstore)
    result = chain.invoke({"input": question})

    sources = []
    for doc in result["context"]:
        sources.append(doc.page_content[:150])

    return {
        "answer": result["answer"],
        "sources": sources
    }
