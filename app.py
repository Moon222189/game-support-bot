from flask import Flask, request, jsonify
import random
import re
import pickle
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

# Founder / Co-founder IDs
FOUNDER_ID = "1323241842975834166"
COFOUNDER_ID = "790777715652952074"

# Session context memory
user_context = {}

# Large corpus of support sentences + multiple rephrasings
corpus = [
    "How do I open a ticket?",
    "Tickets are the fastest way to get help!",
    "To open a ticket, click 'Support' and submit your issue.",
    "Boosting improves perks and server performance.",
    "Hi, I need support",
    "Hello! I can help with Forest Taggers support",
    "Who is Moon?",
    "Moon is the founder of Forest Taggers",
    "Who is Monkey401?",
    "Monkey401 is the co-founder of Forest Taggers",
    "Bye",
    "Goodbye! Have a great day!",
    "I need help with server rules",
    "Please read the server rules channel for guidelines",
    "How to contact staff?",
    "You can contact staff via tickets for fast support",
    "Hello, how are you?",
    "I am here to assist with any Forest Taggers questions",
    "What are server boosts?",
    "Server boosts help everyone enjoy more perks!"
]

# Bad words / robot slurs
bad_words = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"]
robot_slurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"]

# Tokenizer
tokenizer = Tokenizer()
tokenizer.fit_on_texts(corpus)
vocab_size = len(tokenizer.word_index) + 1

# Prepare sequences for LSTM
sequences = []
for line in corpus:
    seq = tokenizer.texts_to_sequences([line])[0]
    for i in range(1, len(seq)):
        sequences.append(seq[:i+1])

max_len = max(len(seq) for seq in sequences)
sequences = np.array(pad_sequences(sequences, maxlen=max_len, padding='pre'))

X, y = sequences[:,:-1], sequences[:,-1]
y = np.eye(vocab_size)[y]

# Build model
model = Sequential()
model.add(Embedding(vocab_size, 50, input_length=max_len-1))
model.add(LSTM(200, return_sequences=False))
model.add(Dense(vocab_size, activation='softmax'))
model.compile(loss='categorical_crossentropy', optimizer='adam')

# Train model
model.fit(X, y, epochs=700, verbose=0)

# Save model and tokenizer
model.save("support_model.h5")
with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

# Function to generate AI response
def generate_response(prompt, user_id=None):
    msg_lower = prompt.lower()

    # Bad words / robot slurs
    if any(word in msg_lower for word in bad_words):
        return "❌ Sorry, Moon didn’t program me to listen to swearwords!"
    if any(slur in msg_lower for slur in robot_slurs):
        return "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)"

    # Track context
    if user_id not in user_context:
        user_context[user_id] = []
    user_context[user_id].append(prompt)

    extra_note = ""
    if user_id == FOUNDER_ID:
        extra_note = "\n(Also… founder detected. I’ll behave 😅)"
    elif user_id == COFOUNDER_ID:
        extra_note = "\n(I wonder why the co-founder needs this… 🤔)"

    # Tokenize prompt
    seq = tokenizer.texts_to_sequences([prompt])[0]
    generated = seq.copy()

    # Generate 25 words dynamically
    for _ in range(25):
        padded = pad_sequences([generated], maxlen=max_len-1, padding='pre')
        pred = np.argmax(model.predict(padded, verbose=0))
        generated.append(pred)

    # Convert sequence to words
    response = " ".join([tokenizer.index_word.get(i, "") for i in generated if i in tokenizer.index_word])

    # Add step-by-step guidance if support keyword
    support_keywords = ["ticket", "support", "boost"]
    if any(word in msg_lower for word in support_keywords):
        response += "\n💡 Tip: Open a ticket in 'Support', describe your issue, and staff will respond ASAP!"

    return response + extra_note

# Flask route
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")
    user_id = data.get("user_id", None)
    response = generate_response(prompt, user_id)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
