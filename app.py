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

# Support corpus (expand with 100+ sentences)
corpus = [
    "How do I open a ticket?",
    "Tickets are the fastest way to get help!",
    "To open a ticket, click on 'Support' and submit your issue.",
    "How can I boost the Discord server?",
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
    "You can contact staff via tickets for fast support"
]

# Bad words / robot slurs
bad_words = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"]
robot_slurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"]

# Tokenizer
tokenizer = Tokenizer()
tokenizer.fit_on_texts(corpus)
vocab_size = len(tokenizer.word_index) + 1

# Prepare sequences
sequences = []
for line in corpus:
    seq = tokenizer.texts_to_sequences([line])[0]
    for i in range(1, len(seq)):
        sequences.append(seq[:i+1])

max_len = max(len(seq) for seq in sequences)
sequences = np.array(pad_sequences(sequences, maxlen=max_len, padding='pre'))

X, y = sequences[:,:-1], sequences[:,-1]
y = np.eye(vocab_size)[y]  # one-hot

# Build model
model = Sequential()
model.add(Embedding(vocab_size, 50, input_length=max_len-1))
model.add(LSTM(150, return_sequences=False))
model.add(Dense(vocab_size, activation='softmax'))
model.compile(loss='categorical_crossentropy', optimizer='adam')

# Train model
model.fit(X, y, epochs=700, verbose=0)

# Save model and tokenizer
model.save("support_model.h5")
with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

# Predictive AI function
def predict_text(prompt, user_id=None):
    msg_lower = prompt.lower()

    # Bad word / slur filtering
    if any(word in msg_lower for word in bad_words):
        return "❌ Sorry, Moon didn’t program me to listen to swearwords!"
    if any(slur in msg_lower for slur in robot_slurs):
        return "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)"

    # Founder / Co-founder notes
    extra_note = ""
    if user_id == FOUNDER_ID:
        extra_note = "\n(Also… founder detected. I’ll behave 😅)"
    elif user_id == COFOUNDER_ID:
        extra_note = "\n(I wonder why the co-founder needs this… 🤔)"

    # Tokenize input
    seq = tokenizer.texts_to_sequences([prompt])[0]
    generated = seq.copy()

    # Generate response dynamically (20 words)
    for _ in range(20):
        padded = pad_sequences([generated], maxlen=max_len-1, padding='pre')
        pred = np.argmax(model.predict(padded, verbose=0))
        generated.append(pred)

    response = " ".join([tokenizer.index_word.get(i, "") for i in generated if i in tokenizer.index_word])
    return response + extra_note

# Flask route
@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")
    user_id = data.get("user_id", None)
    response = predict_text(prompt, user_id)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
