import browser
import traceback
(OK,ERROR) = (0,1)

print("Running python code...")
def runCode(fn):
    print("Compiling Python:")    
    print(fn)
    try:
        vals = {}
        exec(fn, vals)
        browser.window.myVals = vals
        return OK
    except  Exception as inst:
        print(f"Error: {inst}")
        print("Error")
        print(type(inst))
        print(inst.args) 
        print(inst.__str__()) 
        print(dir(inst)) 
        print(traceback.format_exc())
        browser.window.pyCodeError = traceback.format_exc() #inst #f"{inst}"
        return ERROR

browser.window.runPyCode = runCode
