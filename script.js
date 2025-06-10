function resolverEjercicio(n) {
  let x, y, xi, outEl, grafEl;
  if (n === 1) {
    x = [0,5,10,15,20,25];
    y = [25,80,140,180,200,220];
    xi = parseFloat(document.getElementById("xi1").value);
    outEl = document.getElementById("salida1");
    grafEl = document.getElementById("graf1");
  } else if (n === 2) {
    x = [0,3,6,9,12,15];
    y = [2,6,10,8,4,1];
    xi = parseFloat(document.getElementById("xi2").value);
    outEl = document.getElementById("salida2");
    grafEl = document.getElementById("graf2");
  } else {
    x = [1,2,3,4,5,6];
    y = [6.10,6.25,6.33,6.55,6.70,6.85];
    xi = parseFloat(document.getElementById("xi3").value);
    outEl = document.getElementById("salida3");
    grafEl = document.getElementById("graf3");
  }

  const nInterp = interpolacionNewton(x, y, xi),
        lagInterp = interpolacionLagrange(x, y, xi),
        splInterp = splinesCubic(x, y, xi),
        linReg = regressionLineal(x, y, xi);

  const html = `
    <h5>📊 Resultados (xi = ${xi}):</h5>
    <ul>
      <li>Newton: ${nInterp.toFixed(4)}</li>
      <li>Lagrange: ${lagInterp.toFixed(4)}</li>
      <li>Splines: ${splInterp.toFixed(4)}</li>
      <li>Regresión Lineal: ${linReg.toFixed(4)}</li>
    </ul>
    <h6>Conclusión:</h6>
    <p>${conclusiones(n, xi, nInterp, lagInterp, splInterp, linReg)}</p>
  `;
  outEl.innerHTML = html;
  crearGrafico(grafEl, x, y, xi, nInterp, lagInterp, splInterp, linReg);
}

function interpolacionNewton(x, y, xi) {
  const n = x.length;
  const fd = Array(n).fill().map(()=> Array(n).fill(0));
  for (let i=0;i<n;i++) fd[i][0]=y[i];
  for (let j=1;j<n;j++)
    for (let i=0;i<n-j;i++)
      fd[i][j] = (fd[i+1][j-1]-fd[i][j-1])/(x[i+j]-x[i]);
  let res=fd[0][0], term;
  for(let i=1;i<n;i++){
    term=fd[0][i];
    for(let j=0;j<i;j++) term*= (xi-x[j]);
    res+=term;
  }
  return res;
}

function interpolacionLagrange(x,y,xi){
  let res=0;
  for(let i=0;i<x.length;i++){
    let term=y[i];
    for(let j=0;j<x.length;j++){
      if(j!==i) term*=(xi-x[j])/(x[i]-x[j]);
    }
    res+=term;
  }
  return res;
}

function splinesCubic(x,y,xi){
  const n=x.length;
  const h = Array(n-1).fill(0);
  for(let i=0;i<n-1;i++) h[i]= x[i+1]-x[i];
  const alpha = Array(n).fill(0);
  for(let i=1;i<n-1;i++)
    alpha[i] = (3/h[i])*(y[i+1]-y[i]) - (3/h[i-1])*(y[i]-y[i-1]);
  const l=Array(n), mu=Array(n), z=Array(n);
  l[0]=1; mu[0]=z[0]=0;
  for(let i=1;i<n-1;i++){
    l[i]=2*(x[i+1]-x[i-1]) - h[i-1]*mu[i-1];
    mu[i]=h[i]/l[i];
    z[i]=(alpha[i]-h[i-1]*z[i-1])/l[i];
  }
  l[n-1]=1; z[n-1]=0;
  const c=Array(n), b=Array(n-1), d=Array(n-1);
  c[n-1]=0;
  for(let j=n-2;j>=0;j--){
    c[j]=z[j]-mu[j]*c[j+1];
    b[j]=(y[j+1]-y[j])/h[j] - h[j]*(c[j+1]+2*c[j])/3;
    d[j]=(c[j+1]-c[j])/(3*h[j]);
  }
  let i=0;
  for(i=0;i<n-1;i++) if(xi>=x[i] && xi<=x[i+1]) break;
  const dx = xi - x[i];
  return y[i] + b[i]*dx + c[i]*dx*dx + d[i]*dx*dx*dx;
}

function regressionLineal(x,y,xi){
  const n=x.length;
  const xm = x.reduce((a,b)=>a+b)/n;
  const ym = y.reduce((a,b)=>a+b)/n;
  let num=0, den=0;
  for(let i=0;i<n;i++){
    num += (x[i]-xm)*(y[i]-ym);
    den += (x[i]-xm)**2;
  }
  const m=num/den, b=ym-m*xm;
  return m*xi + b;
}

function conclusiones(ej, xi, nI, lI, sI, rI){
  let t="";
  if(ej===1){
    t=`Los métodos muestran estimaciones similares: Newton ~${nI.toFixed(2)}°C, Lagrange ~${lI.toFixed(2)}°C, Spline ~${sI.toFixed(2)}°C,
    regresión muestra tendencia global: ~${rI.toFixed(2)}°C. Para xi=12, el spline es más adecuado para curvas suaves como la temperatura.`;
  } else if(ej===2){
    t=`Interpolación de Newton/Lagrange/Spline dan valores próximos (~${sI.toFixed(2)} m), regresión dá ~${rI.toFixed(2)} m.
    Como la altura varía no linealmente, spline es más confiable.`;
  } else {
    t=`La regresión lineal (~${rI.toFixed(4)}) y los splines (~${sI.toFixed(4)}) son similares.
    Dado que los precios siguen tendencia casi lineal, la regresión es suficiente.`;
  }
  return t;
}

function crearGrafico(cnv, x, y, xi, nI, lI, sI, rI){
  if(cnv.chart) cnv.chart.destroy();
  cnv.chart = new Chart(cnv, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Datos reales', data: x.map((a,i)=>({x:a,y:y[i]})), borderColor:'#0af', backgroundColor:'#0af', showLine: false },
        { label: 'Newton', data: [{x:xi,y:nI}], borderColor:'#f00', backgroundColor:'#f00', showLine: false },
        { label: 'Lagrange', data: [{x:xi,y:lI}], borderColor:'#0f0', backgroundColor:'#0f0', showLine: false },
        { label: 'Spline', data: [{x:xi,y:sI}], borderColor:'#ff0', backgroundColor:'#ff0', showLine: false },
        { label: 'Reg. Lineal', data: [{x:xi,y:rI}], borderColor:'#f0f', backgroundColor:'#f0f', showLine: false },
      ]
    },
    options: {
      scales: {
        x: { title: {display:true, text:'x'}, grid:{color:'#333'}, ticks:{color:'#eee'} },
        y: { title: {display:true, text:'y'}, grid:{color:'#333'}, ticks:{color:'#eee'} }
      },
      plugins: { legend: { labels:{color:'#fff'} } }
    }
  });
}
