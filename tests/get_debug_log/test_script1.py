a = []
max_val = -1
for i in range(10):
    max_val = max(i, max_val)
    print(max_val)
    if i % 2 == 0:
        a.append(i)
    if i == 4:
        print(a)
n = int(input())
if n % 2 == 0:
    a.append(n)


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
print(cnt)
