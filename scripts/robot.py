import browser

speed = [0]*2
an = [0]*10

def motor(i, x):
	sp = int(x) & 0x1FFF;
	speed[i] = sp / 16000.0;

def readsensor(i):
	return an[i]

browser.window.timercallback = None
browser.window.timerfreq = None
class Timer:
	def init(self,*, freq=- 1, callback=None):
		browser.window.timercallback = callback
		browser.window.timerfreq = freq		