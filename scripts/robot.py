import browser

speed = [0]*2
an = [0]*10

def motor(i, x):
	sp = int(x) & 0xFFFF
	speed[i] = sp / 128000.0
def motors(x, y):
	motor(0, x)
	motor(1, y)

def readsensor(i):
	return an[i]
def readsensors(i):
	return an[0:i]

browser.window.timercallback = None
browser.window.timerfreq = None
def timer(freq=-1, callback=None):
	browser.window.timercallback = callback
	browser.window.timerfreq = freq
	