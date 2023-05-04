import browser

print("Running python code...")
def runCode(cpp, fn):
    print("Testing Python")
    print(len(cpp.track))
    print(cpp.track[0].x)
    print(cpp.track[0].y)

    track = []
    for v in cpp.track:
        track.append(v.x+1j*v.y)
    print(track[0])
    print(fn)

browser.window.runPyCode = runCode
