import browser

print("Running python code...")
def runCode(fn):
    print("Compiling Python:")    
    print(fn)
    try:
        vals = {}
        exec(fn, vals)
        browser.window.myVals = vals
    except  Exception as inst:
        print(f"Error: {inst}")
        print("Error")
        print(type(inst))
        print(inst.args) 
        print(inst)   

browser.window.runPyCode = runCode
