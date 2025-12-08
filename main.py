import subprocess
from flask import Flask, request, jsonify
import threading
import time

app = Flask(__name__)

FOUNDER_ID = "1323241842975834166"
COFOUNDER_ID = "790777715652952074"

# Example AI support corpus
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
    "Goodbye! Have a great day! 👋"
]

bad_words = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"]
robot_slurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"]

user_context = {}

def generate_response(prompt, user_id=None):
    prompt_lower = prompt.lower()

    # Bad words
    if any(word in prompt_lower for word in bad_words):
        return "❌ Sorry, Moon didn’t program me to listen to swearwords!"
    # Robot slurs
    if any(slur in prompt_lower for slur in robot_slurs):
        return "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)"

    # Save user context
    if user_id not in user_context:
        user_context[user_id] = []
    user_context[user_id].append(prompt)

    extra_note = ""
    if user_id == FOUNDER_ID:
        extra_note = "\n(Also… founder detected. I’ll behave 😅)"
    elif user_id == COFOUNDER_ID:
        extra_note = "\n(I wonder why the co-founder needs this… 🤔)"

    # Simple dynamic response (can be replaced with real ML model)
    response = ""
    for sentence in corpus:
        if any(word in sentence.lower() for word in prompt_lower.split()):
            response += sentence + " "

    if not response:
        response = "I’m sorry, I can’t answer that 😅 — I only know Forest Taggers support."

    return response.strip() + extra_note

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    prompt = data.get("prompt", "")
    user_id = data.get("user_id", None)
    return jsonify({"response": generate_response(prompt, user_id)})

def start_discord_bot():
    # Delay to ensure backend is running
    time.sleep(3)
    subprocess.Popen(["node", "index.js"])

if __name__ == "__main__":
    # Start Discord bot in a separate thread
    threading.Thread(target=start_discord_bot).start()
    # Start backend
    app.run(host="0.0.0.0", port=5000)
