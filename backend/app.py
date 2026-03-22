import os
import uuid
from flask import Flask,request,jsonify
from flask_cors import CORS
from rag import process_document, answer_question

app = Flask(__name__)
CORS(app,origins=["https://fin-lit-kappa.vercel.app","http://localhost:5173"])

UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER,exist_ok=True)

# 1-Upload PDF

@app.route("/upload",methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error":"No file provided"}), 400
    
    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error":"No file selected"}), 400
    
    if not file.filename.endswith(".pdf"):
        return jsonify({"error":"Only PDF files are supported"}), 400
    
    # Generate unique session ID for document
    session_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER,f"{session_id}.pdf")
    file.save(file_path)

    try:
        chunk_count = process_document(file_path, session_id)
        return jsonify({
            "message":"Document uploaded successfully",
            "session_id":session_id,
            "chunks":chunk_count
        }), 200
    except ValueError as e:
        return jsonify({"error":str(e)}), 400
    except Exception as e:
        return jsonify({"error":"Failed to process document"}), 500
    
# 2- Ask questions

@app.route("/ask",methods=["POST"])
def ask():
    data = request.get_json()

    if not data or "session_id" not in data or "question" not in data:
        return jsonify({"error":"session_id and question are required"}), 400
    
    session_id = data["session_id"]
    question = data["question"]

    if not question.strip():
        return jsonify({"error":"Question cannot be empty"}), 400
    
    try:
        result = answer_question(session_id,question)
        return jsonify({
            "answer":result["answer"],
            "sources":result["sources"]
        }), 200
    except Exception as e:
        return jsonify({"error":"Failed to answer question"}), 500
    

# 3. Health Check

@app.route("/health",methods=["GET"])
def health():
    return jsonify({"status":"ok"}), 200

if __name__=="__main__":
    app.run(host="0.0.0.0",debug=True,port=5000)
        