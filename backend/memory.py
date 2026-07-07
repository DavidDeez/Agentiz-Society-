import os

try:
    import chromadb
except ImportError:
    chromadb = None

class AgentMemory:
    def __init__(self):
        if not chromadb:
            self.collection = None
            return
            
        # Store memory in a local directory
        db_path = os.path.join(os.path.dirname(__file__), 'chroma_data')
        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(name="vc_memos")
        
    def add_memo(self, startup_name: str, pitch: str, decision_memo: str):
        if not self.collection:
            return
            
        doc_id = startup_name.lower().replace(" ", "_")
        self.collection.add(
            documents=[f"Pitch: {pitch}\nDecision: {decision_memo}"],
            metadatas=[{"startup": startup_name}],
            ids=[doc_id]
        )
        
    def query_past_decisions(self, query: str, n_results: int = 1) -> str:
        if not self.collection:
            return "Memory DB not available."
            
        try:
            # If the collection is empty, it might throw an error on query
            if self.collection.count() == 0:
                return "No past decisions in memory."
                
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            if results and results['documents'] and len(results['documents'][0]) > 0:
                docs = results['documents'][0]
                return "\n\n".join(docs)
            return "No relevant past investments found."
        except Exception as e:
            return f"Error querying memory: {e}"

memory_db = AgentMemory()
