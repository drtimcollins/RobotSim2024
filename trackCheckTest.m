t = load('trackData.dat');
t = reshape(t(6:end),2,600)' * [1;j];
t1 = mean(reshape(t,2,300));
t1 = [t1 t1(1)];

P = 200 + 300*j;

c = zeros(1,300);
for n = 1:300
%n = 100;
A = t1(n)
B = t1(n+1);

cf = ((real(B)-real(A)) * (real(P)-real(A)) + (imag(B)-imag(A)) * (imag(P)-imag(A))) / (abs(B-A)^2);
c(n) = cf;
end

t1 = [1, 2+j, 3+3*j, 1];
P = 2.3+0.8*j;

[~,n] = min(abs(t1 - P))
%n =1
A = t1(n)
B = t1(n+1);
cf = ((real(B)-real(A)) * (real(P)-real(A)) + (imag(B)-imag(A)) * (imag(P)-imag(A))) / (abs(B-A)^2);

figure(1);
%plot(t);
plot(t1,'r');
hold on;plot(P,'x');
plot([A A+(B-A)*cf],'g');
hold off;axis equal

figure(2); plot(c)