import os
import re
import time
import json
import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from openai import OpenAI

# Load .env.local
load_dotenv(dotenv_path='.env.local')

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 1. Parse Data
data_path = 'EXP_5_Example_Scenario.txt'
with open(data_path, 'r', encoding='utf-8') as f:
    raw_text = f.read()

scenarios = re.split(r'={30,}', raw_text)
scenarios = [s.strip() for s in scenarios if '[예시' in s]
print(f"Total scenarios found: {len(scenarios)}")

# 2. Rule-Base (RAG) Evaluator
def rule_base_generator(text):
    start_time = time.time()

    # Extract features (lines starting with digit dot)
    features = re.findall(r'^\d+\.\s*(.*)', text, flags=re.MULTILINE)
    if not features:
        features = ["General Setup", "Development", "Deployment"]

    n = len(features)
    budget_per_item = 100 // n if n > 0 else 100
    months_per_item = round(12 / n, 1) if n > 0 else 12

    # Primitive translation dictionary
    translation_dict = {
        '결제': 'Payment',
        '결재': 'Payment',
        '반차': 'Half car',
        'API': 'API',
        '채팅': 'Chatting',
        '일괄': 'One time',
        '다운로드': 'download',
        '안전 재고': 'Safe inventory',
        '가계약': 'Fake contract',
    }

    translated_features = []
    for f in features:
        t = f
        for k, v in translation_dict.items():
            t = t.replace(k, v)
        translated_features.append(t)

    milestones = [{"title": f, "budget_pct": budget_per_item, "months": months_per_item} for f in features]

    latency = time.time() - start_time
    return {
        "latency": latency,
        "milestones": milestones,
        "translation": " | ".join(translated_features)
    }

# 3. LLM Evaluator (OpenAI GPT-4o-mini)
def llm_generator(text):
    start_time = time.time()

    prompt = f"""
    You are an expert SaaS Product Owner and Technical Writer. Analyze the following project scenario and output JSON.
    Return 1 to 5 milestones based on business priority and technical complexity. Allocate exactly 100% budget and exactly 12 months total.
    Translate the core features into professional B2B SOW English (accurately handling proper nouns and domain terms).

    Scenario:
    {text}

    Output Format (JSON strictly):
    {{
      "milestones": [
         {{"title": "...", "budget_pct": 40, "months": 5.0, "priority": 1}}
      ],
      "translation": "English translation summary of core features..."
    }}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" },
            temperature=0.3
        )
        latency = time.time() - start_time
        result_str = response.choices[0].message.content
        result_json = json.loads(result_str)
        return {
            "latency": latency,
            "milestones": result_json.get('milestones', []),
            "translation": result_json.get('translation', '')
        }
    except Exception as e:
        latency = time.time() - start_time
        return {
            "latency": latency,
            "error": str(e)
        }

# 4. Execution
results = []
# Limit to max 15 workers for API rate limits
def process_scenario(i, text):
    rb_res = rule_base_generator(text)
    llm_res = llm_generator(text)
    return {
        "index": i,
        "scenario_preview": text[:50].replace('\n', ' '),
        "rb_latency": round(rb_res['latency'], 4),
        "rb_milestone_count": len(rb_res['milestones']),
        "rb_translation_snippet": rb_res['translation'][:100].replace('\n', ' '),
        "llm_latency": round(llm_res['latency'], 4),
        "llm_milestone_count": len(llm_res.get('milestones', [])),
        "llm_translation_snippet": llm_res.get('translation', '')[:100].replace('\n', ' '),
        "llm_error": llm_res.get('error', '')
    }

print("Starting benchmark with ThreadPoolExecutor...")
start_total = time.time()
with ThreadPoolExecutor(max_workers=15) as executor:
    futures = [executor.submit(process_scenario, idx, s) for idx, s in enumerate(scenarios)]
    for future in as_completed(futures):
        res = future.result()
        results.append(res)
        print(f"Processed scenario {res['index']} | LLM Latency: {res['llm_latency']:.2f}s")

# Sort by index
results.sort(key=lambda x: x['index'])

total_time = time.time() - start_total
print(f"Benchmark completed in {total_time:.2f} seconds.")

# 5. Save to CSV
csv_file = 'benchmark_results.csv'
if results:
    with open(csv_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
    print(f"Results saved to {csv_file}")
else:
    print("No results to save.")
