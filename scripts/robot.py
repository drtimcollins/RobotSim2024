import browser

speed = [0]*2
an = [0]*10

def motor(i, x):
	sp = int(x) & 0x1FFF;
	speed[i] = sp / 16000.0;

def adcread(i):
	return an[i]