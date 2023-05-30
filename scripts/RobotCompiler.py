import browser
import traceback
(OK,ERROR) = (0,1)

browser.window.console.log("Running python code...")
setupCode = """
import browser
def print(x):
    xx = str(x) + '\\n'
    browser.window.simPrintBuffer = browser.window.simPrintBuffer + xx
"""
def runCode(fn):
    browser.window.console.log("Compiling Python:")    
    browser.window.simPrintBuffer = ""
    browser.window.console.log(fn)
    try:
        vals = {}
        exec(setupCode, vals)
        exec(fn, vals)
        #browser.window.console.log(vals) 
        browser.window.myVals = vals
        #browser.window.console.log("myVals updated.") 
        return OK
    except Exception as inst:
        browser.window.console.log(f"Error: {inst}")
        browser.window.console.log("Error")
        browser.window.console.log(type(inst))
        browser.window.console.log(inst.args) 
        browser.window.console.log(inst.__str__()) 
        browser.window.console.log(dir(inst)) 
        browser.window.console.log(traceback.format_exc())
        browser.window.pyCodeError = traceback.format_exc() #inst #f"{inst}"
        return ERROR
    

browser.window.runPyCode = runCode
