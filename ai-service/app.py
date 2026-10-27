from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp import analyze

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return {"message": "AI Resume Screening Service is running"}


@app.post("/analyze")
def analyze_route():
    data = request.get_json(force=True, silent=True) or {}
    result = analyze(
        data.get("resume", ""),
        data.get("jobDescription", ""),
        data.get("jobSkills", []),
    )
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
