import json

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

def search_web(query: str) -> str:
    """Search the web for real-time information."""
    if not DDGS:
        return "Error: duckduckgo-search package is not installed."
    try:
        results = DDGS().text(query, max_results=3)
        if not results:
            return "No results found."
        formatted = ""
        for r in results:
            formatted += f"- {r['title']}: {r['body']}\n"
        return formatted
    except Exception as e:
        return f"Search failed: {e}"

def scrape_url(url: str) -> str:
    """Scrape text content from a URL."""
    try:
        import requests
        from bs4 import BeautifulSoup
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        return text[:1500] + "..." # Truncate to save context window
    except Exception as e:
        return f"Failed to scrape URL: {e}"

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the internet for real-world information, competitor analysis, or technical facts.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "scrape_url",
            "description": "Scrape the text content of a specific URL.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to scrape."
                    }
                },
                "required": ["url"]
            }
        }
    }
]

def execute_tool(name: str, args_json: str) -> str:
    try:
        args = json.loads(args_json)
    except:
        args = {}
        
    if name == "search_web":
        return search_web(args.get("query", ""))
    elif name == "scrape_url":
        return scrape_url(args.get("url", ""))
    return "Tool not found."
