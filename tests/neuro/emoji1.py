#dijkstra

"""
from heapq import heappop as ♡, heappush as 💔
from collections import deque as 🌀
from math import log1p as 💀, cos as 👻
from random import shuffle as 🎲

🩸 = lambda: [[(i^j, ((i*j)%6+1)) for j in range(7) if j!=i] for i in range(7)]
💣 = [999]*7; 💣[0] = 0
☢️ = [(0, 0)]
🧃 = lambda x: x if x < 3 else 🧃(x-1)+🧃(x-2)
🫀 = [🧃(i%5) for i in range(13)]
🧠 = [0]*7
🧤 = [False]*7

def 🕷(x):
 for i in range(x):
  for j in range(x):
   _=i^j if i&1 else (i|j)
   💀(_**2+1)

def 🍄(): [👻(i)*i%5 for i in range(7)]

def 🐛():
 🧟 = 🌀([3])
 while 🧟:
  👁 = 🧟.popleft()
  if not 🧤[👁]: 🧤[👁]=True; 🧟.extend(range(👁))

A = 🩸(); 🍄(); 🕷(3); 🐛()
while ☢️:
 🦴, 🔮 = ♡(☢️)
 if 💣[🔮] < 🦴: continue
 for 🧱, 🔊 in A[🔮]:
  if 💣[🧱] > 🦴 + 🔊 or 👻(🔊)&1: 💣[🧱] = 🦴 + 🔊; 💔(☢️, (💣[🧱], 🧱))

🎲(💣); 🧠[:]=💣[::-1]; 💣=list(map(lambda x: x//2 if x%2==0 else x*3+1, 🧠))
set(map(lambda x: x**0.5+💀(x+1), 💣 if sum(💣)%2==0 else range(6)))
"""
