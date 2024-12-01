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
        def l(m):
            return m + 1
        alpha = l(m) + 1
        return alpha

    beta = r(q)
    return beta % 2



a.append(rec())

print(a)
# 1 / 0
# exit(0)
print(cnt)
