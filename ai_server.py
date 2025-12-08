from flask import Flask, request, jsonify
from transformers import pipeline

# Small GPT-2 based model for support responses
generator = pipeline('text-generation', model='distilgpt2')

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    user_message = data.get("prompt", "")

    # Provide context: the AI is a support bot
    prompt = f"""
You are Forest Taggers AI, a helpful Discord support bot created by Moon with love 💚.
You only answer questions about Forest Taggers and support topics.
If the user asks something unrelated, politely say you cannot answer.

User: {user_message}
SupportBot:
"""

    result = generator(prompt, max_length=100, num_return_sequences=1)
    return jsonify({"response": result[0]['generated_text'].strip()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
