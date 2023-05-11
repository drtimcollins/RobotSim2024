import browser
import traceback
(OK,ERROR) = (0,1)

browser.window.console.log("Running python code...")
def runCode(fn):
    browser.window.console.log("Compiling Python:")    
    browser.window.console.log(fn)
    try:
        vals = {}
        exec("from browser import window\ndef print(x):\n\twindow.simPrintBuffer = x\n", vals)
        exec(fn, vals)
        browser.window.myVals = vals
        print("PRINT TEST")
        return OK
    except  Exception as inst:
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
