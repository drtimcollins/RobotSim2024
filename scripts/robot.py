import browser

#speed = [0, 0]
an = [0]*10

class _MotorOutput:
	def __init__(self, index):
		self.i = index
	def speed(self, x):
		sp = float(int(x) & 0xFFFF)
		browser.window.speed[self.i] = sp / 128000.0	
motor = (_MotorOutput(0), _MotorOutput(1))
def motors(x, y):
    motor[0].speed(x)
    motor[1].speed(y)

class _SensorInput:
	def __init__(self, index):
		self.i = index
	def read(self):
		return an[self.i]
def readsensors(i):
	return an[0:i]
sensor = ()

def _initialise():
    global sensor
    for n in range(6):
        sensor = sensor + (_SensorInput(n),)

_initialise()

browser.window.timercallback = None
browser.window.timerfreq = None
def timer(frequency=-1, callback=None):
	browser.window.timercallback = callback
	browser.window.timerfreq = frequency
	