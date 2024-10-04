from threading import Timer

_progress_bars = {}


def register(level):
    global _progress_bars
    _progress_bars[level] = ConsoleProgressBar()


def get(level):
    global _progress_bars
    return _progress_bars.get(level, None)


class ConsoleProgressBar:

    def __init__(self, widget=None):
        super().__init__()

        self._max = 0
        self._cur = 0

        self.set_max(100)
        self.set_cur(0)

    def __call__(self, l):
        import time

        n = l.__len__()
        self.set_max(n)
        for i in l:
            # yield i
            self.inc()
        self.set_cur(0)

    def max(self):
        return self._max

    def set_max(self, val):
        if val < 0:
            raise Exception("Nao ne ... manda um maior que zero ai ...")
        self._max = val

        self._reset()

    def cur(self):
        return self._cur

    def _reset(self):
        self.set_cur(0)

    def reset(self):
        # reset in a second, enough time to see animation of completing progressbar
        timer = Timer(1, self._reset)
        timer.start()
        # self.set_cur(0)

    def set_cur(self, val):
        self._cur = max(min(val, self._max), 0)

    def inc(self, val=1):
        self.set_cur(self._cur + val)


register("main")
