import json
from collections import defaultdict

LOG_FILE = "usage_stats.jsonl"

def load_entries():
    with open(LOG_FILE) as f:
        for line in f:
            yield json.loads(line)

if __name__ == "__main__":
    users = {}
    monthly = defaultdict(float)
    for e in load_entries():
        ip = e["ip"]
        ms = e["ms"]
        ts = e["ts"]
        month = ts[:7]
        monthly[month] += ms
        if ip not in users:
            users[ip] = {"first_ts": e.get("first_ts", ts), "total_ms": ms}
        else:
            users[ip]["total_ms"] += ms
            if ts < users[ip]["first_ts"]:
                users[ip]["first_ts"] = ts

    print("Total users:", len(users))
    for ip, u in sorted(users.items(), key=lambda item: item[1]["first_ts"]):
        print(f"{ip} {u['first_ts']} {round(u['total_ms']/1000,1)}s")

    print("Monthly totals:")
    for month, ms in sorted(monthly.items()):
        print(f"{month} {round(ms/1000,1)}s")