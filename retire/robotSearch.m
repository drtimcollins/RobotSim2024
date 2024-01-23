ks = [40000:5000:50000];
bs = [50000:5000:70000];
fprintf('[\n');
for n = 1:length(ks)
    k = ks(n);
    for m = 1:length(bs)
        b = bs(m);
        fprintf('{"ID":"%d/%d", "width":95,"length":100,"WheelRadius":20,"NumberOfSensors":3,"SensorSpacing":18,"BodyColour":"b80505","WheelColour":"2c2a51","LEDColour":"yellow","Code":"import robot\\n\\ndtable = [0, -1, 0, -0.5, 1, 0, 0.5, 0]\\nk = %d\\nb = %d\\ndef RobotControl():\\n\\ta = robot.readsensors(3)\\n\\ti = 0\\n\\tif(a[0] > 16500):\\n\\t\\ti = i + 1\\n\\tif(a[1] > 16500):\\n\\t\\ti = i + 2\\n\\tif(a[2] > 16500):\\n\\t\\ti = i + 4\\n\\te = dtable[i]\\t\\n\\t\\n\\trobot.motors(max(0, min(k + e*b, 65535)), max(0, min(k - e*b, 65535)))\\n\\nrobot.timer(freq = 50, callback = RobotControl)\\n\\t\\t\\t"}',k,b,k,b);
        if(~(m==length(bs) && n ==length(ks)))
            fprintf(',\n');
        else
            fprintf('\n]\n');
        end
    end
end