from flask import Flask, request, jsonify
import random
import pickle
import numpy as np
import requests
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding, Bidirectional
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

# Founder / Co-founder IDs
FOUNDER_ID = "1323241842975834166"
COFOUNDER_ID = "790777715652952074"

# User session context
user_context = {}

# Expanded corpus of support sentences + variations
corpus = [
    "How do I open a ticket?",
    "Tickets are the fastest way to get help! 💬",
    "To open a ticket, click 'Support' and submit your issue.",
    "Boosting improves perks and server performance. ✨",
    "Hi, I need support",
    "Hello! I can help with Forest Taggers support 💚",
    "Who is Moon?",
    "Moon is the founder of Forest Taggers 🌙",
    "Who is Monkey401?",
    "Monkey401 is the co-founder of Forest Taggers 🐒",
    "Bye",
    "Goodbye! Have a great day! 👋",
    "I need help with server rules",
    "Please read the server rules channel for guidelines 📜",
    "How to contact staff?",
    "You can contact staff via tickets for fast support 💌",
    "Hello, how are you?",
    "I am here to assist with any Forest Taggers questions 🤖",
    "What are server boosts?",
    "Server boosts help everyone enjoy more perks! 🚀"
]

# Bad words / robot slurs
bad_words = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"]
robot_slurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"]

# Tokenizer setup
tokenizer = Tokenizer()
tokenizer.fit_on_texts(corpus)
vocab_size = len(tokenizer.word_index) + 1
max_len = max(len(tokenizer.texts_to_sequences([s])[0]) for s in corpus)

# Prepare sequences for LSTM
sequences = []
for line in corpus:
    seq = tokenizer.texts_to_sequences([line])[0]
    for i in range(1, len(seq)):
        sequences.append(seq[:i+1])
sequences = pad_sequences(sequences, maxlen=max_len, padding='pre')
X, y = sequences[:, :-1], sequences[:, -1]
y = np.eye(vocab_size)[y]

# Build LSTM model
model = Sequential()
model.add(Embedding(vocab_size, 50, input_length=max_len-1))
model.add(Bidirectional(LSTM(200)))
model.add(Dense(vocab_size, activation='softmax'))
model.compile(loss='categorical_crossentropy', optimizer='adam')

# Train model (small corpus, fast training)
model.fit(X, y, epochs=700, verbose=0)

# Save model & tokenizer
model.save("support_model.h5")
with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

# Function to get live server info (example)
def get_server_status():
    try:
        res = requests.get("https://api.example.com/status")
        return res.json()["status"]
    except:
        return "Unknown"

# Generate AI response
def generate_response(prompt, user_id=None):
    msg_lower = prompt.lower()

    # Bad word / robot slur filter
    if any(word in msg_lower for word in bad_words):
        return "❌ Sorry, Moon didn’t program me to listen to swearwords!"
    if any(slur in msg_lower for slur in robot_slurs):
        return "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)"

    # Track conversation context
    if user_id not in user_context:
        user_context[user_id] = []
    user_context[user_id].append(prompt)

    extra_note = ""
    if user_id == FOUNDER_ID:
        extra_note = "\n(Also… founder detected. I’ll behave 😅)"
    elif user_id == COFOUNDER_ID:
        extra_note = "\n(I wonder why the co-founder needs this… 🤔)"

    # Tokenize input and generate prediction
    seq = tokenizer.texts_to_sequences([prompt])[0]
    generated = seq.copy()
    for _ in range(25):
        padded = pad_sequences([generated], maxlen=max_len-1, padding='pre')
        pred = np.argmax(model.predict(padded, verbose=0))
        generated.append(pred)

    response = " ".join([tokenizer.index_word.get(i, "") for i in generated if i in tokenizer.index_word])

    # Add support step-by-step instructions
    support_keywords = ["ticket", "support", "boost"]
    if any(word in msg_lower for word in support_keywords):
        response += "\n💡 Tip: Open a ticket in 'Support', describe your issue, and staff will respond ASAP!"

    return response + extra_note

# Flask API
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")
    user_id = data.get("user_id", None)
    response = generate_response(prompt, user_id)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
