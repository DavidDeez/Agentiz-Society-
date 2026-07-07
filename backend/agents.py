import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv
from .tools import TOOLS_SCHEMA, execute_tool

load_dotenv()

api_key = os.getenv("QWEN_API_KEY", os.getenv("OPENAI_API_KEY", "sk-dummy-key"))
base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"

client = AsyncOpenAI(api_key=api_key, base_url=base_url)
MODEL = "qwen-plus"

class Agent:
    def __init__(self, name: str, role_description: str, has_tools: bool = False):
        self.name = name
        self.role_description = role_description
        self.has_tools = has_tools
        
    async def generate_response(self, context: str, prompt: str, yield_callback=None, override_api_key=None) -> str:
        system_prompt = f"You are {self.name}. {self.role_description}\n\nContext:\n{context}"
        
        # Use override key if provided, else global
        if override_api_key and override_api_key != "sk-dummy-key":
            local_client = AsyncOpenAI(api_key=override_api_key, base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
        else:
            local_client = client
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            kwargs = {
                "model": MODEL,
                "messages": messages,
                "temperature": 0.7
            }
            if self.has_tools:
                kwargs["tools"] = TOOLS_SCHEMA
                
            iterations = 0
            while iterations < 5:
                response = await local_client.chat.completions.create(**kwargs)
                message = response.choices[0].message
                
                # Handle Qwen Tool Calling in a loop (ReAct Pattern)
                if not hasattr(message, 'tool_calls') or not message.tool_calls:
                    return message.content
                    
                messages.append(message)
                
                for tool_call in message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = tool_call.function.arguments
                    
                    if yield_callback:
                        await yield_callback({
                            "event": "tool_call",
                            "agent": self.name,
                            "tool": tool_name,
                            "args": tool_args
                        })
                        
                    tool_result = execute_tool(tool_name, tool_args)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result
                    })
                
                iterations += 1
                kwargs["messages"] = messages
                
            return "Agent reached maximum iterations without completing the task."
            
        except Exception as e:
            if not override_api_key or override_api_key == "sk-dummy-key":
                 return f"[{self.name} Mock Output]: Using dummy key. Assuming tool results look fine."
            return f"API Error: {str(e)}"

tech_expert = Agent(
    name="Tech Expert",
    role_description="You evaluate technical feasibility. If the startup claims novel tech, search the web to verify.",
    has_tools=True
)

finance_analyst = Agent(
    name="Finance Analyst",
    role_description="You evaluate market size. Search the web for competitors to validate their claims.",
    has_tools=True
)

risk_assessor = Agent(
    name="Risk Assessor",
    role_description="You identify major risks. Search for recent regulatory news in their sector.",
    has_tools=True
)

lead_investor = Agent(
    name="Lead Investor",
    role_description="You synthesize reports, coordinate the debate, and output the final Investment Memo. You do not use tools directly.",
    has_tools=False
)
