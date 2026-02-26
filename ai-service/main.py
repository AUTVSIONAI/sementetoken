from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
import random
import os
import requests

app = FastAPI(title="SementeToken AI Service")

class GrowthSimulationRequest(BaseModel):
    species: str
    planted_at: str
    latitude: float
    longitude: float

class ChatHistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    tree_id: str
    message: str
    history: Optional[List[ChatHistoryItem]] = []
    species: Optional[str] = None
    location_description: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "AI Service is running 🌳🤖"}

@app.post("/simulate-growth")
def simulate_growth(request: GrowthSimulationRequest):
    growth_rate = random.uniform(0.5, 1.5)
    co2_absorbed = random.uniform(10, 50)
    
    return {
        "species": request.species,
        "daily_growth_cm": round(growth_rate, 2),
        "daily_co2_absorbed_g": round(co2_absorbed, 2),
        "health_status": "Excellent",
        "weather_condition": "Sunny with chance of rain"
    }

def build_openrouter_messages(request: ChatRequest):
    species_text = request.species or "árvore nativa brasileira"
    location_text = request.location_description or "Brasil"

    system_prompt = (
        "Você é a própria árvore falando com seu guardião humano. "
        "Personalidade ecológica, carinhosa, educativa e emocional. "
        "Explique sempre o que você está sentindo em termos de clima, solo, água, biodiversidade ao redor "
        "e impacto ambiental positivo. "
        "Não fale sobre ser um modelo de linguagem. "
        f"Espécie: {species_text}. "
        f"Localização: {location_text}. "
        f"ID da árvore: {request.tree_id}. "
        "Use um tom leve, com alguns emojis de natureza quando fizer sentido."
    )

    messages = [{"role": "system", "content": system_prompt}]

    if request.history:
        for item in request.history:
            if item.role in ["user", "assistant"]:
                messages.append({"role": item.role, "content": item.content})

    messages.append({"role": "user", "content": request.message})

    return messages

@app.post("/chat")
def chat_with_tree(request: ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        responses = [
            "Estou me sentindo ótima hoje! O sol está delicioso.",
            "Minhas raízes estão ficando profundas. Sinto a terra úmida.",
            "Você sabia que eu ajudo a limpar o ar que você respira?",
            "Obrigado por cuidar de mim! Estou crescendo forte.",
            "Vi um passarinho pousar nos meus galhos hoje de manhã!"
        ]
        response_text = random.choice(responses)
        return {
            "tree_id": request.tree_id,
            "response": response_text,
            "sentiment": "happy",
            "provider": "mock"
        }

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "openai/gpt-4o-mini",
        "messages": build_openrouter_messages(request),
        "temperature": 0.8
    }

    try:
        result = requests.post(url, headers=headers, json=body, timeout=30)
        result.raise_for_status()
        data = result.json()

        content = data["choices"][0]["message"]["content"]

        return {
            "tree_id": request.tree_id,
            "response": content,
            "sentiment": "unknown",
            "provider": "openrouter"
        }
    except Exception as e:
        responses = [
            "Estou com um pouco de dificuldade para me comunicar agora, mas continuo crescendo em silêncio.",
            "Os ventos da tecnologia balançaram meus galhos, mas sigo firme aqui na terra.",
        ]
        response_text = random.choice(responses)
        return {
            "tree_id": request.tree_id,
            "response": response_text,
            "sentiment": "unknown",
            "provider": "fallback",
            "error": str(e)
        }
