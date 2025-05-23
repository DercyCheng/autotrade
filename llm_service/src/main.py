from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from services.llm_service import LLMService
import uvicorn
import grpc
from protos import llm_pb2, llm_pb2_grpc

app = FastAPI(title="LLM Service API",
             description="HTTP/GRPC interface for deepseek and qwen3 LLMs")

# 初始化LLM服务
llm_service = LLMService()

class TextRequest(BaseModel):
    prompt: str
    model_name: str = "deepseek-7b"
    max_length: int = 128
    temperature: float = 0.7

class TextResponse(BaseModel):
    generated_text: str
    tokens_generated: int

class ModelInfoRequest(BaseModel):
    model_name: str

class ModelInfoResponse(BaseModel):
    model_name: str
    max_length: int
    architecture: str

@app.post("/generate", response_model=TextResponse)
async def generate_text(request: TextRequest):
    try:
        generated_text = llm_service.generate_text(
            prompt=request.prompt,
            model_name=request.model_name,
            max_length=request.max_length,
            temperature=request.temperature
        )
        return {
            "generated_text": generated_text,
            "tokens_generated": len(generated_text.split())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info/{model_name}", response_model=ModelInfoResponse)
async def get_model_info(model_name: str):
    try:
        info = llm_service.get_model_info(model_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def start_grpc_client():
    channel = grpc.insecure_channel('localhost:50051')
    return llm_pb2_grpc.LLMServiceStub(channel)

if __name__ == "__main__":
    # 启动GRPC服务
    import threading
    from server import serve
    grpc_thread = threading.Thread(target=serve)
    grpc_thread.start()

    # 启动HTTP服务
    uvicorn.run(app, host="0.0.0.0", port=8000)