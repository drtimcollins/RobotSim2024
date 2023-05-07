t = load('trackData.dat');
t = reshape(t(6:end),2,600)' * [1;j];
t1 = mean(reshape(t,2,300));
t1 = [t1 t1(1)];

[x,y] = meshgrid(0:1299, 0:699);
i = zeros(size(x));

for m = 1:numel(i)
    P = x(m)+j*y(m);
    [~,n] = min(abs(t1(1:(length(t1)-1)) - P));
    A = t1(n);

    n1 = n - 1;
    if(n1 < 1)
        n1 = length(t1)-1;
    end
    B = t1(n1);
    cf1 = ((real(B)-real(A)) * (real(P)-real(A)) + (imag(B)-imag(A)) * (imag(P)-imag(A))) / (abs(B-A)^2);
    d1 = abs(P - A - (B-A)*cf1);

    n1 = n + 1;
    B = t1(n1);
    cf2 = ((real(B)-real(A)) * (real(P)-real(A)) + (imag(B)-imag(A)) * (imag(P)-imag(A))) / (abs(B-A)^2);
    d2 = abs(P - A - (B-A)*cf2);

    if(cf1 >= 0 && cf1 <= 1 && cf2 >= 0 && cf2 <= 1)
        i(m) = min(d1,d2);
    elseif(cf1 >= 0 && cf1 <= 1)
        i(m) = d1;
    elseif(cf2 >= 0 && cf2 <= 1)
        i(m) = d2;
    else
        i(m) = abs(P - t1(n));
    end

end

i(i<=10)=0;
i(i>100)=100;

figure(1);

imagesc(0:1299, 0:699,i);
hold on;
plot(t,'g');
plot(t1,'r');
hold off;axis equal
