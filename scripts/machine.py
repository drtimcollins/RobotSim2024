import browser

browser.window.timercallback = None

class Timer:
	(ONE_SHOT, PERIODIC) = (0, 1)
	def init(self,*, mode=PERIODIC, freq=- 1, period=- 1, callback=None):
		browser.window.timercallback = callback		
