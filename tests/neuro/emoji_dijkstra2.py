# import heapq as 🧺
#
# def 🏃‍♂️_📍(🌍, 🎯):
#     📏 = {📌: float('inf') for 📌 in 🌍}
#     📏[🎯] = 0
#     👣 = []
#     🧺.heappush(👣, (0, 🎯))
#     👀 = {}
#
#     while 👣:
#         🎒, 📌 = 🧺.heappop(👣)
#
#         if 🎒 > 📏[📌]:
#             continue
#
#         for 🤝, 💰 in 🌍[📌]:
#             🆕 = 🎒 + 💰
#             if 🆕 < 📏[🤝]:
#                 📏[🤝] = 🆕
#                 👀[🤝] = 📌
#                 🧺.heappush(👣, (🆕, 🤝))
#
#     return 📏, 👀
