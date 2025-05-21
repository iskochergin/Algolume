# <img src="media/a.ico" width="24" height="24" alt="a icon" /> [Algolume](https://example.com)

A tool to visualize programming algorithms step-by-step!

The website contains theoretical information about algorithms and their visualization.  
There is an opportunity for you to run the example code or visualize **your own one!**

To visualize your code, you can point the needed names of variables specifically in your code.  
Then the engine of Python returns the execution trace of the code and a JS script builds the visualization for the algorithm you have chosen.  
Also, if you don't want to find the algorithm through the list and simply want to visualize it, you can use Algolume Neuro!

<div align="center">
  <a href="https://algolume.ru" target="_blank" rel="noopener">
    <svg xmlns="http://www.w3.org/2000/svg"
         width="480" height="80" viewBox="0 0 480 80">
      <defs>
        <!-- glassy blur+saturate -->
        <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="
              1.4 0   0   0 0
              0   1.4 0   0 0
              0   0   1.4 0 0
              0   0   0   1 0
            " result="saturated"/>
        </filter>
        <!-- gradient for the title -->
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#58a6ff"/>
          <stop offset="100%" stop-color="#d4bfff"/>
        </linearGradient>
      </defs>

      <!-- background card -->
      <rect x="0" y="0" width="480" height="80" rx="8" ry="8"
            fill="white" fill-opacity="0.04"
            filter="url(#glass-blur)"/>

      <!-- text group -->
      <g font-family="Open Sans, sans-serif" font-weight="600">
        <!-- Title -->
        <text x="16" y="28" font-size="18" fill="url(#text-gradient)">
          Algolume Neuro
        </text>
        <!-- Tagline -->
        <text x="16" y="46" font-size="12" fill="#ddd">
          A neural-network powered tool to distinguish your algorithms.
        </text>
        <text x="16" y="62" font-size="12" fill="#ddd">
          Paste your code and it will visualize the most appropriate algorithm for you!
        </text>
      </g>
    </svg>
  </a>
</div>

---

By this moment there are 4 algorithms available:

- DP (Turtle task)
- DP (Grasshopper task)
- DFS
- BFS
- Dijkstra's

---

#### Get into it and check how it works!

> You can simply access our Python debugging system by [algolume.ru/debug](https://algolume.ru/debug) and try to debug any python code you have.
