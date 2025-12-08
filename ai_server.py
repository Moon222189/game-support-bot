from flask import Flask, request, jsonify
from transformers import pipeline

# Small GPT-2-based model
generator = pipeline('text-generation', model='distilgpt2')

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")
    result = generator(prompt, max_length=100, num_return_sequences=1)
    return jsonify({"response": result[0]['generated_text']})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
