import numpy as np

m = np.ones((3,3))



for i in range(3):
    for j in range(3):
        m[i,j] = j + i*3

print(m)