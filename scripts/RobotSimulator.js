// RobotDraw using three.js
var MAXSENSORS = 10;

import { RobotScene } from './RobotScene.js';
import { RobotSim } from './RobotSim.js';
import { RobotGui } from './RobotGui.js';
import { SmartCam } from './SmartCam.js';
import { RobotCompiler } from './RobotCompiler.js';
import { Stats } from './Stats.js';

const dispMode = {DESIGN:1, RACE:2};
var dmode = dispMode.DESIGN;

var camera, scene, renderer, gui, clk, cpp;

const sceneParams = [{width:1280, height:720, sf: new THREE.Vector2(640,643), name:'simpleTrack'},
                    {width:1280, height:720, sf: new THREE.Vector2(640,642), name:'hairPin2022'},
                    {width:1280, height:720, sf: new THREE.Vector2(640,661), name:'twisty2022'}];

var robotParams = {
    width: 95,
    length: 100,
    NumberOfSensors: 1,
    SensorSpacing: 15,
    WheelRadius: 20};
var robot, rec, laps, editor;
var lastTime, bestTime, isRaceOver;
var splitTime, splitFrameCount;
var scenes, cpps;
var stats;
var lod = 0;    // Full detail - higher values reduce detail.

// Start-up initialisation
$(function(){  
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/eclipse");
    editor.session.setMode("ace/mode/c_cpp");
    editor.setShowPrintMargin(false);	
   
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
//    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.id = "threeDrenderer"

    scenes = []; cpps = [];
    for(let i = 0; i < 3; i++){
        scenes.push(new RobotScene(sceneParams[i], onTrackLoaded));
        cpps.push(new RobotCompiler());
    }
    scene = scenes[0];

    robot = new RobotSim(scene, robotParams);    
    camera = new SmartCam(scene, robot);
    camera.change(6);
    $("#renderWin").append(renderer.domElement);   
    clk = new THREE.Clock(false);
    gui = new RobotGui(onIconClicked);
    cpp = cpps[0];

    $('.runButton').prop('disabled', true);
    $('#guiWin').hide();

    $('#botColour').bind('input',function(){
        console.log("Colour selected.");
        robot.shape.setBodyColour($('#botColour').val());
    });
    $('#wheelColour').bind('input',function(){
        console.log("Colour selected.");
        robot.shape.setWheelColour($('#wheelColour').val());
    });
    $('input[type=radio][name=LEDcolor]').change(function() {
        robot.shape.setLEDColour(this.value);
        console.log(this.value);
    });
    $("#selectFiles").change(function(e) {
        uploadDesign(e);
    });
    $("#selectFiles").bind('input',function(e) {
       console.log("IINPUTT");
    });

    stats = new Stats();
    //$("#renderWin").append(stats.dom);

    onResize();
    update(0);
});

$(document).ready(function(){
    $(window).resize(function(){console.log("Resize");onResize();});
});

function onSliderChanged(){
    robotParams.length = parseFloat($('#sliderLength').val());
    robotParams.width = parseFloat($('#sliderWidth').val());
    robotParams.SensorSpacing = parseFloat($('#sliderSpacing').val());
    robotParams.NumberOfSensors = parseFloat($('#sliderNumSensors').val()); 
    robotParams.WheelRadius = parseFloat($('#sliderWheelDiameter').val()) / 2;   
    robot.shape.setSize(robotParams);
}

function onIconClicked(i){
    console.log(i + " pressed");
    const index = parseInt(i.substring(4));
    if(index < 3){
        gui.camMode = index;
        camera.change(gui.camMode * 2 + gui.camZoom);
    } else if(index < 5) {
        gui.camZoom = index - 3;
        camera.change(gui.camMode * 2 + gui.camZoom);
    } else if(index == 5){
        console.log("Slow motion");
        splitFrameCount = getFrameCount();
        splitTime = clk.getElapsedTime();
        gui.isSloMo = !gui.isSloMo;
    } else{
        camera.change(6);
        $('#guiWin').hide();
        $('#designerWin').show();         
        dmode = dispMode.DESIGN;
        robot.shape.refreshLEDs();
        update(0);  
        onResize();      
    }
    gui.refillIcons();
}

function onTrackLoaded(){
    console.log("Track Loaded");
    if(scenes[0].isLoaded && scenes[1].isLoaded && scenes[2].isLoaded){
        for(let i = 0; i < 3; i++){
            scenes[i].trackLine.geometry.computeBoundingBox();
            var vertices = [];
            for(let n = 0; n < scenes[i].trackLine.geometry.getAttribute("position").array.length/3; n++)
                vertices.push(new THREE.Vector2(scenes[i].trackLine.geometry.getAttribute("position").array[n*3], scenes[i].trackLine.geometry.getAttribute("position").array[n*3+1]));
            cpps[i].init({track: vertices, start: sceneParams[i].sf, robot: robotParams, bbox: scenes[i].trackLine.geometry.boundingBox});
        }
        $('.runButton').prop('disabled', false);
    }
}

function getFrameCount(){
    return splitFrameCount + (clk.getElapsedTime() - splitTime) * (gui.isSloMo ? 5.0 : 50.0);
}

function update() {
    // Set visibility
    scene.trackMesh.visible = scene.trackBase.visible = (dmode == dispMode.RACE);
    for(let n = 0; n < 4; n++) scene.legs[n].visible = scene.trackBase.visible;
    scene.gridHelper.visible = scene.turntableTop.visible = scene.turntable.visible = !(dmode == dispMode.RACE);
    scene.room.forEach(x => x.visible = (dmode == dispMode.RACE));

    let frameCount = getFrameCount();

    if(dmode == dispMode.RACE){
        if(frameCount <= 3000.0){   // 60 seconds
            let lapTime = 0;
            let lapStart = 0;
            laps.forEach(lapn=>{ if(frameCount > lapn){
                lapTime = lapn - lapStart;
                lapStart = lapn;
                bestTime = Math.min(lapTime, bestTime);
            }}); 
            gui.timers[1].setTime(lapTime * 20.0);   
            gui.timers[0].setTime(Math.max((frameCount-lapStart) * 20.0, 0));   
            if(frameCount - lapStart < lastTime)
                $('#coutBox').text($('#coutBox').text() + '\n' + 'Lap Time: ' + getTimeString(lapTime * 20.0));
            lastTime = frameCount - lapStart;
        } else {
            gui.timers[0].setTime(0);
            if(!isRaceOver){
                isRaceOver = true;
                if(bestTime < 100000)
                    $('#coutBox').text($('#coutBox').text() + '\n' + 'Simulation over. Best lap: ' + getTimeString(bestTime * 20.0));
                else
                    $('#coutBox').text($('#coutBox').text() + '\n' + 'Simulation over. No complete laps recorded.');
            }
        }
    }

    if(robot.isLoaded()){
        if(!clk.running) clk.start();
        if(dmode == dispMode.RACE){
            robot.play(rec, frameCount);
        } else { // DESIGN mode
            robot.designShow(clk.getElapsedTime() * 50.0);
        }
    }
    
    // Change level of detail to maintian frame rate on low spec GPUs
    stats.update();
    if(stats.checkMe){
        stats.checkMe = false;
        if(stats.good && lod > 0) lod--;
        if(stats.bad && lod < 3) lod++;
        console.log("FPS = " + stats.fps.toString());
        console.log("LOD = " + lod.toString());     
    }
    if(lod > 0){
         scene.lights.forEach(l => l.castShadow = false);     
    } else {
        scene.lights.forEach(l => l.castShadow = true);
    }
    if(lod > 1){
        scene.room.forEach(l => l.visible = false);
    }
    if(lod > 2){
         scene.trackBase.visible = false;
         scene.legs.forEach(l => l.visible = false);
    }

    camera.update();
    renderer.render( scene, camera );
    requestAnimationFrame( update );
}

function getTimeString(ms){
    let ts = "";
    var digits = new Array(6);
    let z = Math.floor(ms/10);
    for(var n = 0; n < 6; n++){
        let d = (n==3) ? 6 : 10;
        let z1 = Math.floor(z/d);
        ts = ((n==1 || n == 3)?':':'') + (z - z1*d) + ts;
        z = z1;
    }
    return ts;
}

function onResize(){
    const w = $("#renderWin").width();
    if(renderer != null){
        $("#renderWin").height(w*sceneParams[0].height/sceneParams[0].width);
        renderer.setSize(w, $("#renderWin").height());
    }
    if(gui != null){
        gui.resize(w);
    }
     console.log("Height: " + $(document).get(0).body.scrollHeight);
     parent.postMessage($(document).get(0).body.scrollHeight, "*");
}
function showProgress(isShow){
    parent.postMessage(isShow ? -2 : -1, "*");
}

function batchRun(){
    console.log("Batch Run");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var oArray = JSON.parse(this.responseText);
            $('#coutBox').text('');

            var idNum = -1;
            var trNum = 2;
            var isDone = true;

            (function batchProc(){
                if(isDone){
                    if(trNum == 2){ idNum++; trNum = 0; } else { trNum++; }
                    isDone = false;
                    var o = oArray[idNum];
                    cpp = cpps[trNum];  // Loop this
                    cpp.updateParams({width: o.width, length: o.length, NumberOfSensors: o.NumberOfSensors, SensorSpacing: o.SensorSpacing, WheelRadius: o.WheelRadius});
                    console.log(o);
                    if(trNum == 0) $('#coutBox').text($('#coutBox').text() + '\n' + o.ID);
                    cpp.exe(o.Code, function(data){
                        console.log("Ran");
                        if(data.Errors == null){
                            const recStr = data.Result;
                            let recItems = recStr.split(/\r?\n/);
                            laps = [];
                            recItems.forEach(rItem => {
                                let recDat = rItem.split(' ');
                                if(recDat.length == 2){
                                    laps.push(parseInt(recDat[1]) * 20);
                                }
                            });
                            for(let n = laps.length-1; n > 0; n--)  laps[n] -= laps[n-1];                    
                            console.log(laps);
                            console.log(Math.min(...laps));
                            $('#coutBox').text($('#coutBox').text() + ", " + Math.min(...laps) / 1000.0);
                        }
                        isDone = true;
                        if(!(trNum == 2 && idNum == oArray.length-1)) setTimeout(batchProc, 0);
                    });
                }
            })();
        }
    };
    xmlhttp.open("GET", "dataFiles.json", true);
    xmlhttp.send();
}

function runCode(trackIndex){
//    if(robot.shape.radius > 125){
//        $('#coutBox').text("Fail\nRobot is too big. Maximum diameter = 250mm, robot diameter = "+(robot.shape.radius*2.0).toFixed(1)+"mm\n"); 
    if(!robot.shape.sizeOK){
        $('#coutBox').text("Fail\nRobot is too big. See the project specification for limits."); 
    } else {
        //$('#progress').show();
        showProgress(true);
        console.log("RUN CODE");    
        cpp = cpps[trackIndex];
        if(cpp.isInit) {
            cpp.updateParams(robotParams);
            setTimeout(function(){
            cpp.exe(editor.getValue(), function(data){
                if(data.Errors == null){
                    $('#coutBox').text(data.Stats);
                    const recStr = data.Result;
                    let recItems = recStr.split(/\r?\n/);
                    rec = [];
                    laps = [];
                    recItems.forEach(rItem => {
                        let recDat = rItem.split(' ');
                        if(recDat.length == 2){
                            laps.push(parseInt(recDat[1]));
                        } else if(recDat.length == 8+cpp.bot.NumberOfSensors){
                            let pose = {xy: math.Complex(parseFloat(recDat[0]),parseFloat(recDat[1])), 
                                bearing: math.Complex(parseFloat(recDat[2]),parseFloat(recDat[3])),
                                L: math.Complex(parseFloat(recDat[4]),parseFloat(recDat[5])),
                                R: math.Complex(parseFloat(recDat[6]),parseFloat(recDat[7])), 
                                an: new Array(cpp.bot.NumberOfSensors)};                
                            for(var n = 0; n < cpp.bot.NumberOfSensors; n++)
                                pose.an[n] = (recDat[8+n] == "0") ? 0 : 0xFFFFFF;
                            rec.push({pose: $.extend(true,{},pose)});
                        }
                    });
                    lastTime = -100;
                    bestTime = 100000;
                    isRaceOver = false;
                    splitTime = 0;
                    splitFrameCount = -50;
                    clk.stop();
                    clk.elapsedTime = 0;
                    $('#guiWin').show();
                    $('#designerWin').hide();            
                    parent.postMessage(0, "*");   // Scroll to top
                    camera.change(gui.camMode * 2 + gui.camZoom);                
                    dmode = dispMode.RACE;
                    scene = scenes[trackIndex];
                    robot.changeScene(scene);
                    camera.changeScene(scene);
                    onResize();
                } else { // Report Errors
                    var errs = data.Errors;
                    var regex = /main\.cpp:(\d+):/g
                    var match;
                    while ((match = regex.exec(errs)) != null) {
                        let ln = parseInt(match[1]) - 143;
                        errs = errs.substring(0,match.index+9)+ln.toString()+errs.substring(match.index+9+match[1].length);
                        regex.lastIndex += match[1].length - ln.toString().length;
                    }
                    var regex2 = /  (\d\d\d) \|/g
                    while ((match = regex2.exec(errs)) != null) {
                        let ln = parseInt(match[1]) - 143;
                        errs = errs.substring(0,match.index)+" ".repeat(5-ln.toString().length)+ln.toString()+errs.substring(match.index+5);
                        regex2.lastIndex += match[1].length - ln.toString().length;
                    }

                    $('#coutBox').text('Program Build Failed\n'+errs.replace("RobotControlCode::",""));
                }
                //$('#progress').hide();
                showProgress(false);
            });}, 100);
        }
    }
}

function downloadDesign(){
    console.log("Downloading");

    var robotParameters = {
        width: robotParams.width,
        length: robotParams.length,
        WheelRadius: robotParams.WheelRadius,
        NumberOfSensors: robotParams.NumberOfSensors,
        SensorSpacing: robotParams.SensorSpacing,
        BodyColour: robot.shape.body2.material.color.getHexString(),
        WheelColour: robot.shape.Rw.material.color.getHexString(),
        LEDColour: robot.shape.LEDColour,
        Code: editor.getValue()
    };

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(robotParameters)));
    element.setAttribute('download', "robotData.txt");
    
    element.style.display = 'none';
    document.body.appendChild(element);    
    element.click();
    document.body.removeChild(element);
}

function uploadDesign(event){
    console.log("Uploading");
    var reader = new FileReader();
    reader.onload = function(event){
        var o = JSON.parse(event.target.result);
        if(o.WheelRadius == undefined) o.WheelRadius = 20;
        $('#sliderLength').val(o.length);
        $('#inputLength').val(o.length);
        $('#sliderWidth').val(o.width);
        $('#inputWidth').val(o.width);        
        $('#sliderWheelDiameter').val(o.WheelRadius*2);
        $('#inputWheelDiameter').val(o.WheelRadius*2);                
        $('#sliderSpacing').val(o.SensorSpacing);
        $('#inputSpacing').val(o.SensorSpacing);
        $('#sliderNumSensors').val(o.NumberOfSensors);
        $('#inputNumSensors').val(o.NumberOfSensors);
        robotParams.width = o.width;
        robotParams.length = o.length;
        robotParams.WheelRadius = o.WheelRadius;
        robotParams.NumberOfSensors = o.NumberOfSensors;
        robotParams.SensorSpacing = o.SensorSpacing;
        robot.shape.setSize(robotParams);
        robot.shape.setBodyColour('#'+o.BodyColour);
        robot.shape.setWheelColour('#'+o.WheelColour);
        $('#botColour').val('#'+o.BodyColour);
        $('#wheelColour').val('#'+o.WheelColour);
        $('input:radio[name=LEDcolor][value='+o.LEDColour+']').click();
        editor.setValue(o.Code);
        editor.clearSelection();
    }
    reader.readAsText(event.target.files[0]);
    $('#selectFiles').val("");
}

window.batchRun = batchRun;
window.runCode = runCode;
window.downloadDesign = downloadDesign;
window.uploadDesign = uploadDesign;
window.onSliderChanged = onSliderChanged;
export{MAXSENSORS};
