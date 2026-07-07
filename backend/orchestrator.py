import asyncio
import json
import uuid
from .agents import tech_expert, finance_analyst, risk_assessor, lead_investor
from .memory import memory_db
from .alibaba_oss import upload_memo_to_oss

async def run_due_diligence(pitch: str, api_key: str = None, ali_access_key: str = None, ali_secret_key: str = None, ali_bucket: str = None, ali_endpoint: str = None):
    session_id = str(uuid.uuid4())[:8]
    startup_name = "Unknown Startup"
    try:
        lines = pitch.split('\n')
        for line in lines:
            if "name" in line.lower() or ":" in line:
                startup_name = line.split(":")[-1].strip()
                break
    except:
        pass

    queue = asyncio.Queue()
    
    async def stream_callback(event_data):
        await queue.put(json.dumps(event_data) + "\n\n")

    yield json.dumps({"event": "status", "message": "Lead Investor is querying Memory DB for past similar investments..."}) + "\n\n"
    
    past_memo = memory_db.query_past_decisions(pitch, n_results=1)
    if "No past decisions" not in past_memo and "Memory DB not available" not in past_memo:
        yield json.dumps({"event": "memory_retrieved", "content": past_memo}) + "\n\n"
    
    yield json.dumps({"event": "status", "message": "Lead Investor is delegating tasks to the society..."}) + "\n\n"
    yield json.dumps({"event": "task_delegation", "tasks": ["tech", "finance", "risk"]}) + "\n\n"
    
    tech_task = asyncio.create_task(tech_expert.generate_response(pitch, "Evaluate the technical merits of this pitch.", yield_callback=stream_callback, override_api_key=api_key))
    finance_task = asyncio.create_task(finance_analyst.generate_response(pitch, "Evaluate the financial viability.", yield_callback=stream_callback, override_api_key=api_key))
    risk_task = asyncio.create_task(risk_assessor.generate_response(pitch, "Identify all major risks.", yield_callback=stream_callback, override_api_key=api_key))
    
    async def wait_for_tasks():
        return await asyncio.gather(tech_task, finance_task, risk_task)

    tasks_future = asyncio.ensure_future(wait_for_tasks())
    
    while not tasks_future.done():
        try:
            msg = await asyncio.wait_for(queue.get(), timeout=0.5)
            yield msg
        except asyncio.TimeoutError:
            continue
            
    while not queue.empty():
        msg = await queue.get()
        yield msg

    tech_res, finance_res, risk_res = tasks_future.result()
    
    yield json.dumps({"event": "agent_report", "agent": "Tech Expert", "content": tech_res}) + "\n\n"
    yield json.dumps({"event": "agent_report", "agent": "Finance Analyst", "content": finance_res}) + "\n\n"
    yield json.dumps({"event": "agent_report", "agent": "Risk Assessor", "content": risk_res}) + "\n\n"
    
    yield json.dumps({"event": "status", "message": "Lead Investor is routing for conflict resolution..."}) + "\n\n"
    
    synthesis_context = f"Past Memory:\n{past_memo}\n\nPitch:\n{pitch}\n\nTech:\n{tech_res}\n\nFinance:\n{finance_res}\n\nRisk:\n{risk_res}"
    
    debate_history = ""
    for r in range(2):
        conflict_check_prompt = f"Review the reports and debate history so far: {debate_history}\nAre there any major disagreements? If yes, ask specific agents to clarify or defend. If satisfied, output 'NO_CONFLICT'."
        
        conflict_res = await lead_investor.generate_response(synthesis_context, conflict_check_prompt, override_api_key=api_key)
        
        if "NO_CONFLICT" in conflict_res.upper() or len(conflict_res) < 20:
            break
            
        yield json.dumps({"event": "conflict_detected", "content": f"(Round {r+1}) " + conflict_res}) + "\n\n"
        yield json.dumps({"event": "status", "message": f"Agents are debating (Round {r+1})..."}) + "\n\n"
        
        debate_tech = await tech_expert.generate_response(synthesis_context + f"\n\nLead Investor asks: {conflict_res}", "Respond briefly.", yield_callback=stream_callback, override_api_key=api_key)
        yield json.dumps({"event": "agent_report", "agent": "Tech Expert", "content": debate_tech}) + "\n\n"
        
        debate_finance = await finance_analyst.generate_response(synthesis_context + f"\n\nLead Investor asks: {conflict_res}", "Respond briefly.", yield_callback=stream_callback, override_api_key=api_key)
        yield json.dumps({"event": "agent_report", "agent": "Finance Analyst", "content": debate_finance}) + "\n\n"
        
        while not queue.empty():
             yield await queue.get()
             
        debate_history += f"\nRound conflict: {conflict_res}\nTech response: {debate_tech}\nFinance response: {debate_finance}"
    
    yield json.dumps({"event": "status", "message": "Lead Investor is making the final decision..."}) + "\n\n"
    
    final_decision = await lead_investor.generate_response(synthesis_context + debate_history, "Write a final Investment Memo summarizing findings, the debate, and an 'INVEST' or 'PASS' verdict.", override_api_key=api_key)
    
    oss_result = "Skipped"
    if "API Error" not in final_decision and "invalid_api_key" not in final_decision:
        memory_db.add_memo(startup_name, pitch, final_decision)
        oss_result = upload_memo_to_oss(final_decision, session_id, ali_access_key, ali_secret_key, ali_bucket, ali_endpoint)
    
    yield json.dumps({"event": "final_decision", "content": final_decision, "oss_upload": oss_result}) + "\n\n"
