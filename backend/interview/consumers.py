import json
import os
import websocket
from django.http import JsonResponse
from dotenv import load_dotenv


load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


# WebSocket function
def on_message(ws, message):
    # This function handles incoming messages from the WebSocket server
    print("Message received:", message)
    data = json.loads(message)
    ws.close()  # Close the WebSocket connection after receiving the message
    return data


def on_error(ws, error):
    print("WebSocket error:", error)


def on_close(ws):
    print("WebSocket closed.")


def on_open(ws):
    # Send initial message to the WebSocket server
    ws.send(json.dumps({
        "type": "response.create",
        "response": {
            "modalities": ["text"],
            "instructions": "Please assist the user."
        }
    }))


# View function that uses WebSocket
def connect_to_realtime_api(request):
    ws_url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
    ws_headers = {
        "Authorization": "Bearer " + OPENAI_API_KEY,
        "OpenAI-Beta": "realtime=v1"
    }

    try:
        # Establish WebSocket connection
        ws = websocket.WebSocketApp(
            ws_url,
            header=ws_headers,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )

        # Run the WebSocket connection
        ws.run_forever()

        # Since the WebSocket is synchronous, we'll return a response here
        return JsonResponse({"status": "WebSocket connection successful"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)