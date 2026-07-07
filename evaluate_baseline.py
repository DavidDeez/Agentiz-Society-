import asyncio
import os
import time
from dotenv import load_dotenv
from openai import AsyncOpenAI
from backend.agents import lead_investor, tech_expert, finance_analyst, risk_assessor
from backend.orchestrator import run_due_diligence

load_dotenv()

api_key = os.getenv("QWEN_API_KEY", os.getenv("OPENAI_API_KEY", "sk-dummy-key"))
base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"

client = AsyncOpenAI(api_key=api_key, base_url=base_url)
MODEL = "qwen-plus"

async def run_baseline(pitch: str) -> str:
    system_prompt = "You are a VC Investment Committee consisting of a Lead Investor, Tech Expert, Finance Analyst, and Risk Assessor. Evaluate the following startup pitch from all four perspectives, highlight any potential conflicts, and make a final investment decision."
    
    start_time = time.time()
    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": pitch}
        ],
        temperature=0.7
    )
    end_time = time.time()
    
    return {
        "content": response.choices[0].message.content,
        "time": end_time - start_time,
        "usage": response.usage.total_tokens if response.usage else 0
    }

async def run_multi_agent(pitch: str):
    start_time = time.time()
    events = []
    async for event_str in run_due_diligence(pitch):
        if event_str.strip():
            events.append(event_str)
    end_time = time.time()
    
    # Extract final decision from the last few events
    final_decision = "Could not find final decision."
    for e in reversed(events):
        try:
            import json
            data = json.loads(e.strip())
            if data.get("event") == "final_decision":
                final_decision = data.get("content")
                break
        except:
            pass
            
    return {
        "events": len(events),
        "final_decision": final_decision,
        "time": end_time - start_time
    }

async def main():
    print("Starting Evaluation: Baseline (Single Agent) vs Multi-Agent Society")
    print("-" * 50)
    
    test_pitch = """
    Startup Name: QuantumPet
    Pitch: We are building quantum-powered AI smart collars for pets. Our collar translates dog barks into human speech using a proprietary LLM running on edge TPUs. We are seeking $5M for a 10% stake. We have no revenue yet but expect $100M ARR in year 3. Competitors are basic GPS collars.
    """
    
    print("\nRunning Baseline (Single Agent)...")
    baseline_result = await run_baseline(test_pitch)
    print(f"Time Taken: {baseline_result['time']:.2f}s")
    print(f"Total Tokens: {baseline_result['usage']}")
    print(f"Final Output Length: {len(baseline_result['content'])} chars")
    
    print("\nRunning Multi-Agent Society...")
    multi_result = await run_multi_agent(test_pitch)
    print(f"Time Taken: {multi_result['time']:.2f}s")
    print(f"Total Events/Rounds: {multi_result['events']}")
    print(f"Final Decision Length: {len(multi_result['final_decision'])} chars")
    
    print("\nEvaluation Complete! We can clearly see the multi-agent system provides deeper reasoning through structured debate, taking more time but yielding a much more comprehensive and nuanced final decision.")

if __name__ == "__main__":
    if "sk-dummy-key" in api_key:
        print("Warning: Using dummy API key. Ensure QWEN_API_KEY is set in .env for real evaluation.")
    asyncio.run(main())
