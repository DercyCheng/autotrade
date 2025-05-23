import os
from typing import Optional
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import mlx.core as mx

class LLMService:
    def __init__(self):
        self.models = {}
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        print(f"Using device: {self.device}")
        
    def load_model(self, model_name: str):
        """加载指定的LLM模型"""
        if model_name in self.models:
            return
        
        model_path = f"/app/models/{model_name}"
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model {model_name} not found at {model_path}")
        
        # 加载tokenizer和模型
        tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
        
        if self.device == "mps":
            # 使用MLX优化
            model = mx.load_model(model_path)
        else:
            model = AutoModelForCausalLM.from_pretrained(
                model_path, 
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
        self.models[model_name] = {
            "model": model,
            "tokenizer": tokenizer
        }
        
    def generate_text(self, prompt: str, model_name: str, max_length: int = 128, temperature: float = 0.7) -> str:
        """生成文本"""
        if model_name not in self.models:
            self.load_model(model_name)
            
        model_info = self.models[model_name]
        tokenizer = model_info["tokenizer"]
        model = model_info["model"]
        
        inputs = tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True
            )
            
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    def get_model_info(self, model_name: str) -> dict:
        """获取模型信息"""
        if model_name not in self.models:
            self.load_model(model_name)
            
        return {
            "model_name": model_name,
            "max_length": 2048,  # 7B模型典型上下文长度
            "architecture": "Transformer"
        }