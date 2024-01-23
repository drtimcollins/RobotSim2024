#include <iostream>
#include <complex>
#include <iomanip>
//#include <string>
//#include <sstream>
#define DEFINES
#define black_threshold 100
using namespace std;

complex<double> bearing	(1.0, 0);
complex<double> R		(1.0, 0);
complex<double> L		(1.0, 0);
complex<double> speed	(0, 0);
complex<double> av		(0, 0);
complex<double> xy		(XSTART, YSTART);
complex<double> vv, cFront;
complex<double> j		(0, 1);
complex<double> sensorPos[NumberOfSensors];
int an[NumberOfSensors];
complex<double> *track;
int N;
complex<double> trackBounds[2];
bool isLapValid = false;

string hexIt(int t){
  ostringstream oss;
  oss << setfill('0') << setw(4) << uppercase << hex << t;
  string ret = oss.str();
  return ret.substr(ret.length()-4, 4);
}
string hexSensors(){
    int z = 0;
    for(int n = 0; n < NumberOfSensors; n++) z = (z >> 1) | ((an[n] > 0)?0x200:0);
    ostringstream oss;
    oss << setfill('0') << setw(3) << uppercase << hex << z;
    return oss.str();    
}
string toHex(){
    return  hexIt((int)round(16.0 * (xy.real()-640.0))) + 
            hexIt((int)round(16.0 * (xy.imag()-360.0))) +
            hexIt((int)round(10000.0 * arg(bearing))) +
            hexIt((int)round(10000.0 * arg(L))) +
            hexIt((int)round(10000.0 * arg(R))) +
            hexSensors();
}
void readTrack(void);
namespace RobotControlCode{void RobotControl();}
int signFn(double x, double y, complex<double> p2, complex<double> p3){
	return ((x-real(p3))*(imag(p2)-imag(p3))-(real(p2)-real(p3))*(y-imag(p3)) > 0) ? 1 : -1;
}
bool isInQuad(double x, double y, int i0, int i1, int i2, int i3){
	int d0 = signFn(x, y, track[i0], track[i1]);
	int d1 = signFn(x, y, track[i1], track[i2]);
	int d2 = signFn(x, y, track[i2], track[i3]);
	int d3 = signFn(x, y, track[i3], track[i0]);
	return (d0==d1 && d1==d2 && d2==d3);
}
int getSensorOutput(double x, double y){
	if(x < real(trackBounds[0]) || y < imag(trackBounds[0]) || x > real(trackBounds[1]) || y > imag(trackBounds[1]))
		return 0;   
	else{		
		for(int n = 0; n < N/2; n++){
			if(isInQuad(x, y, n*2, n*2+1, (n*2+3)%N, (n*2+2)%N))
				return 0xFFFFFF;
		}
		return 0;
	}
}
void updateSensors(void){
	complex<double> sn;
	for(int n = 0; n < NumberOfSensors; n++) {
		sn = sensorPos[n]*bearing + xy; 
		an[n] = getSensorOutput(real(sn),imag(sn));
	}        
}	
int main(){	
	cout << "###OK###" << endl;
	readTrack();
	for(int n = 0; n < NumberOfSensors; n++) {
		sensorPos[n] = complex<double> (rlength, (n - (NumberOfSensors-1.0)/2.0)*SensorSpacing);
	}	
	int iTrack = 0;
	for(int n = 0; n < 3000; n++){
		updateSensors();
		RobotControlCode::RobotControl();
		//av = av*0.9 + speed*0.1;	
		av = av*0.92 + speed*0.08;	// angular velocity is av rad/frame or 50av rad/s
		//av = av*0.95 + speed*0.05;
		//av = av*0.97 + speed*0.03;
		vv = bearing * (double)WheelRadius*(real(av) + imag(av))/2.0;
		bearing *= exp(j*(double)WheelRadius*((real(av)-imag(av))/width));
		cFront = xy + bearing * (double)rlength;
		while(abs(cFront - track[(iTrack+ISTART)%N]) < 150.0){
			iTrack++;
			if(iTrack > N){
				iTrack = 0;
				isLapValid = true;
			}
		}
		if(real(cFront) < XSTART+rlength && real(cFront+vv) >= XSTART+rlength && imag(cFront) > YSTART-50 && isLapValid){
			cout << "L " << n << endl;
			isLapValid = false;
		}

		xy += vv;
		L *= exp(-j*(real(av)));	// wheel speed is av rad/frame = 50av rad/s
		R *= exp(-j*(imag(av)));
		cout << toHex() << endl;
	}
	delete[] track;
	return 0;	
}
void readTrack(void){
	double r, i;
	for(int n = 0; n < 2; n++){
		cin >> r >> i;	
		trackBounds[n] = complex<double>(r,i);
	}
	cin >> N;
	track = new complex<double>[N];
	for(int n = 0; n < N; n++){
		cin >> r >> i;	
		track[n] = complex<double>(r,i);
	}
}
void Set_PWM(int n, double spNew){
/*	double sp = spNew;
	sp = (sp >= 0) ? sp : 0;
	sp = (sp <= 8191) ? sp : 8191;*/
	int spI = ((int)spNew) & 0x1FFF;
	double sp = (double)spI;
	if(n == 0)
		speed = complex<double>(sp / 16000.0, imag(speed));
	else
		speed = complex<double>(real(speed), sp / 16000.0);
}
namespace RobotControlCode{
#define ROBOTCONTROLFUNCTION
}