from concurrent import futures
import grpc
import logging
from services.llm_service import LLMService
from protos import llm_pb2, llm_pb2_grpc
import os

class LLMServicer(llm_pb2_grpc.LLMServiceServicer):
    def __init__(self):
        self.llm_service = LLMService()
        
    def GenerateText(self, request, context):
        try:
            generated_text = self.llm_service.generate_text(
                prompt=request.prompt,
                model_name=request.model_name,
                max_length=request.max_length or 128,
                temperature=request.temperature or 0.7
            )
            return llm_pb2.TextResponse(
                generated_text=generated_text,
                tokens_generated=len(generated_text.split())
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return llm_pb2.TextResponse()
            
    def GetModelInfo(self, request, context):
        try:
            info = self.llm_service.get_model_info(request.model_name)
            return llm_pb2.ModelInfoResponse(
                model_name=info["model_name"],
                max_length=info["max_length"],
                architecture=info["architecture"]
            )
        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return llm_pb2.ModelInfoResponse()

def serve():
    # 生成GRPC代码
    os.system("python -m grpc_tools.protoc -I protos --python_out=. --grpc_python_out=. protos/llm.proto")
    
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    llm_pb2_grpc.add_LLMServiceServicer_to_server(LLMServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    print("GRPC Server started on port 50051")
    server.wait_for_termination()

if __name__ == "__main__":
    logging.basicConfig()
    serve()