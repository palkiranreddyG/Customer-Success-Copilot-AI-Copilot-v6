from langgraph.graph import StateGraph, START, END
from backend.agents.state import AgentState
from backend.agents.planner_agent import run_planner
from backend.agents.ingestion_agent import run_ingestion
from backend.agents.retrieval_agent import run_retrieval
from backend.agents.analysis_agent import run_analysis
from backend.agents.recommendation_agent import run_recommendation
from backend.agents.explanation_agent import run_explanation
from backend.agents.evaluation_agent import run_evaluation
from backend.db.sqlite import update_pipeline_run_state, get_account_by_id, save_recommendations

# 1. Node definitions
def planner_node(state: AgentState) -> dict:
    account_context = get_account_by_id(state["account_id"])
    if not account_context:
        account_context = {
            "id": state["account_id"],
            "name": "Unknown Account",
            "arr": 0.0,
            "health_score": 0,
            "tenure_months": 0
        }
        
    decision = run_planner(state["raw_text"], account_context)
    
    updated_state = {
        "planner_decision": decision,
        "interaction_type": decision.get("interaction_type", "")
    }
    
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def ingestion_node(state: AgentState) -> dict:
    result = run_ingestion(state["raw_text"])
    
    updated_state = {}
    errors = list(state.get("errors", []))
    
    if "error" in result:
        errors.append(result["error"])
        updated_state["errors"] = errors
        
    # Merge entities into planner_decision
    dec = dict(state.get("planner_decision", {}))
    dec["detected_entities"] = result.get("detected_entities", [])
    
    updated_state["planner_decision"] = dec
    updated_state["raw_text"] = result.get("cleaned_text", state["raw_text"])
    
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def retrieval_node(state: AgentState) -> dict:
    # Retrieve chunks using cleaned transcript text (which is stored in raw_text) and account_id
    result = run_retrieval(state["raw_text"], state["interaction_type"], state["account_id"])
    
    updated_state = {
        "retrieved_chunks": result.get("chunks", [])
    }
    
    if "warning" in result:
        errors = list(state.get("errors", []))
        errors.append(result["warning"])
        updated_state["errors"] = errors
        
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def analysis_node(state: AgentState) -> dict:
    account_context = get_account_by_id(state["account_id"])
    if not account_context:
        account_context = {
            "id": state["account_id"],
            "name": "Unknown Account",
            "arr": 0.0,
            "health_score": 0,
            "tenure_months": 0
        }
        
    result = run_analysis(state["raw_text"], state["retrieved_chunks"], account_context)
    
    updated_state = {
        "analysis": result
    }
    
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def recommendation_node(state: AgentState) -> dict:
    account_context = get_account_by_id(state["account_id"])
    if not account_context:
        account_context = {
            "id": state["account_id"],
            "name": "Unknown Account",
            "arr": 0.0,
            "health_score": 0,
            "tenure_months": 0
        }
        
    critique = state.get("critique", "")
    result = run_recommendation(state["analysis"], account_context, critique)
    recommendations_list = result.get("recommendations", [])
    
    updated_state = {
        "recommendations": recommendations_list
    }
    
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def explanation_node(state: AgentState) -> dict:
    result = run_explanation(state["recommendations"], state["retrieved_chunks"])
    recs = list(state["recommendations"])
    evidence_list = result.get("evidence", [])
    
    evidence_by_idx = {item.get("recommendation_index"): item for item in evidence_list}
    
    updated_recs = []
    for idx, rec in enumerate(recs):
        rec_copy = dict(rec)
        item = evidence_by_idx.get(idx)
        if item:
            rec_copy["evidence"] = {
                "source": item.get("source", "unknown"),
                "section": item.get("section", "unknown"),
                "quoted_text": item.get("quoted_text", ""),
                "supported": item.get("supported", False)
            }
        else:
            rec_copy["evidence"] = {
                "source": "unknown",
                "section": "unknown",
                "quoted_text": "",
                "supported": False
            }
        updated_recs.append(rec_copy)
        
    updated_state = {
        "recommendations": updated_recs
    }
    
    # Save intermediate state to SQLite
    full_state = {**state, **updated_state}
    update_pipeline_run_state(state["session_id"], full_state, "running")
    return updated_state

def evaluation_node(state: AgentState) -> dict:
    eval_results = run_evaluation(state["recommendations"])
    recs = list(state["recommendations"])
    
    any_failed = False
    critique_reasons = []
    
    updated_recs = []
    for idx, (rec, eval_res) in enumerate(zip(recs, eval_results)):
        rec_copy = dict(rec)
        if "id" not in rec_copy or not rec_copy["id"]:
            rec_copy["id"] = f"rec-{state['session_id'][:8]}-{idx}"
        rec_copy["evaluation_passed"] = eval_res.get("passed")
        rec_copy["evaluation_reasons"] = eval_res.get("reasons", [])
        
        if not eval_res.get("passed"):
            any_failed = True
            critique_reasons.append(f"Rec {idx} failed: " + ", ".join(eval_res.get("reasons", [])))
            rec_copy["evaluation_status"] = "flagged_low_confidence"
        else:
            rec_copy["evaluation_status"] = "approved"
            
        updated_recs.append(rec_copy)
        
    attempts = state.get("evaluation_attempts", 0)
    
    if any_failed and attempts == 0:
        updated_state = {
            "recommendations": updated_recs,
            "evaluation_attempts": attempts + 1,
            "critique": "; ".join(critique_reasons)
        }
        # Save intermediate state to SQLite
        full_state = {**state, **updated_state}
        update_pipeline_run_state(state["session_id"], full_state, "running")
        return updated_state
    else:
        updated_state = {
            "recommendations": updated_recs,
            "evaluation_attempts": attempts + 1
        }
        # Save recommendations to database
        save_recommendations(state["session_id"], state["account_id"], updated_recs)
        
        # Save intermediate state to SQLite
        full_state = {**state, **updated_state}
        update_pipeline_run_state(state["session_id"], full_state, "running")
        return updated_state

# 2. Routing logic
def route_to_agents(state: AgentState):
    agents = state.get("planner_decision", {}).get("agents", [])
    if "ingestion" in agents:
        return "ingestion"
    elif "retrieval" in agents:
        return "retrieval"
    else:
        return "analysis"

def route_after_ingestion(state: AgentState):
    agents = state.get("planner_decision", {}).get("agents", [])
    if "ingestion" in agents:
        try:
            idx = agents.index("ingestion")
            for next_agent in agents[idx + 1:]:
                if next_agent == "retrieval":
                    return "retrieval"
        except ValueError:
            pass
    return "analysis"

def route_after_evaluation(state: AgentState):
    attempts = state.get("evaluation_attempts", 0)
    # Check if there are any failed recommendations in the current list
    recs = state.get("recommendations", [])
    any_failed = any(not r.get("evaluation_passed", True) for r in recs)
    
    # If any failed and we just ran attempt 1 (evaluation_attempts was incremented to 1), route back to recommendation
    if any_failed and attempts == 1:
        return "recommendation"
    else:
        return "__end__"

# 3. Create and compile graph
workflow = StateGraph(AgentState)

workflow.add_node("planner", planner_node)
workflow.add_node("ingestion", ingestion_node)
workflow.add_node("retrieval", retrieval_node)
workflow.add_node("analysis", analysis_node)
workflow.add_node("recommendation", recommendation_node)
workflow.add_node("explanation", explanation_node)
workflow.add_node("evaluation", evaluation_node)

workflow.set_entry_point("planner")

workflow.add_conditional_edges(
    "planner",
    route_to_agents,
    {
        "ingestion": "ingestion",
        "retrieval": "retrieval",
        "analysis": "analysis"
    }
)

workflow.add_conditional_edges(
    "ingestion",
    route_after_ingestion,
    {
        "retrieval": "retrieval",
        "analysis": "analysis"
    }
)

workflow.add_edge("retrieval", "analysis")
workflow.add_edge("analysis", "recommendation")
workflow.add_edge("recommendation", "explanation")
workflow.add_edge("explanation", "evaluation")

workflow.add_conditional_edges(
    "evaluation",
    route_after_evaluation,
    {
        "recommendation": "recommendation",
        "__end__": END
    }
)

app_graph = workflow.compile()

# 4. Asynchronous task execution helper
def execute_graph_task(session_id: str, account_id: str, raw_text: str):
    initial_state = {
        "session_id": session_id,
        "account_id": account_id,
        "raw_text": raw_text,
        "interaction_type": "",
        "retrieved_chunks": [],
        "planner_decision": {},
        "analysis": {},
        "recommendations": [],
        "evaluation_attempts": 0,
        "critique": "",
        "errors": []
    }
    
    try:
        final_state = app_graph.invoke(initial_state)
        # Update state in SQLite to "complete"
        update_pipeline_run_state(session_id, final_state, "complete")
    except Exception as e:
        print(f"LangGraph execution failed: {e}")
        initial_state["errors"].append(f"Orchestration Graph Execution Error: {str(e)}")
        update_pipeline_run_state(session_id, initial_state, "failed")
