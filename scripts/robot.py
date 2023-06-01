import browser

#speed = [0, 0]
an = [0]*10

def motor(i, x):
	sp = float(int(x) & 0xFFFF)
	browser.window.speed[i] = sp / 128000.0
def motors(x, y):
	motor(0, x)
	motor(1, y)

def readsensor(i):
	return an[i]
def readsensors(i):
	return an[0:i]

browser.window.timercallback = None
browser.window.timerfreq = None
def timer(frequency=-1, callback=None):
	browser.window.timercallback = callback
	browser.window.timerfreq = frequency
	