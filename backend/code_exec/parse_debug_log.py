import requests
import json
from pprint import pprint


def execute_code(code_snippet: str) -> dict:
    url = "https://pythontutor.com/web_exec_py3.py"

    payload = {
        "user_script": code_snippet,
        "raw_input_json": "",
        "options_json": json.dumps({
            "cumulative_mode": False,
            "heap_primitives": False,
            "show_only_outputs": False,
            "origin": "opt-frontend.js",
            "fe_disableHeapNesting": True,
            "fe_textualMemoryLabels": False
        }),
        "n": 55
    }

    response = requests.post(url, data=payload)

    return response.json()


pprint(execute_code("""a = []
max_val = -1
for i in range(10):
    max_val = max(i, max_val)
    print(max_val)
    if i % 2 == 0:
        a.append(i)
    if i == 4:
        print(a)
#n = int(input())
#if n % 2 == 0:
#    a.append(n)


print(a)
cnt = 0


def rec(q=3):
    def r(m):
        if m % 2 == 0:
            return m // 2
        else:
            return m
    q = r(q)
    global cnt
    cnt += 1
    if q <= 0:
        return 2
    return rec(q - 1) * rec(q - 2)


a.append(rec())

print(a)
# 1 / 0
# exit(0)
print(cnt)"""))
