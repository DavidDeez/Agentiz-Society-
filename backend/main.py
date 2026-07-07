from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from .orchestrator import run_due_diligence

from typing import Optional

app = FastAPI(title="Agentiz Society API")

# Allow CORS for the frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from openai import AsyncOpenAI

class PitchRequest(BaseModel):
    pitch: str

class GeneratePitchRequest(BaseModel):
    company_name: str

@app.post("/generate_pitch")
async def generate_pitch(
    request: GeneratePitchRequest,
    x_api_key: Optional[str] = Header(None)
):
    if not x_api_key or x_api_key == "sk-dummy-key" or not x_api_key.startswith("sk-"):
        return {"pitch": f"Startup Name: {request.company_name}\nPitch: We are building the future of our industry using advanced AI. We are seeking a $2M seed round to scale our operations globally."}
        
    client = AsyncOpenAI(api_key=x_api_key, base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
    try:
        response = await client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": "You are a startup founder. Generate a 2-3 sentence startup pitch for the given company name. It should sound extremely ambitious, use modern tech buzzwords, and state how much money you are raising and what for. Start exactly with 'Startup Name: [Name]\nPitch: '"},
                {"role": "user", "content": f"Company Name: {request.company_name}"}
            ]
        )
        return {"pitch": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze")
async def analyze_pitch(
    request: PitchRequest, 
    x_api_key: Optional[str] = Header(None),
    x_ali_access_key: Optional[str] = Header(None),
    x_ali_secret_key: Optional[str] = Header(None),
    x_ali_bucket: Optional[str] = Header(None),
    x_ali_endpoint: Optional[str] = Header(None)
):
    return StreamingResponse(
        run_due_diligence(request.pitch, x_api_key, x_ali_access_key, x_ali_secret_key, x_ali_bucket, x_ali_endpoint),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
