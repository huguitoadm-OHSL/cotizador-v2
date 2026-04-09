import React, { useState, useEffect } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Building2, ChevronRight, FileText, Tag, MapPin, Gift, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

export default function App() {
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  // Inicializados vacíos
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  
  // Estados de Descuentos
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); 

  // Estados para ACTIVAR/DESACTIVAR DESCUENTOS
  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(true);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(true);
  const [aplicarDescM2, setAplicarDescM2] = useState(true);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(true);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(true);

  // Estados de Inicial
  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);

  // Inyectar fuente y animaciones CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Lógica Automática de Proyectos
  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado("");

    // Resetear activadores de descuento al cambiar de proyecto
    setAplicarDescContadoPct(true);
    setAplicarDescCreditoPct(true);
    setAplicarDescM2(true);
    setAplicarDescContadoM2(true);
    setAplicarBonoInicialOtro(true);

    if (proyecto === "MUYURINA" || proyecto === "SANTA FE") {
      setDescuentoCredito(20); setDescuentoContado(30); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    } else if (proyecto === "EL RENACER" || proyecto === "LOS JARDINES") {
      setDescuentoCredito(0); setDescuentoContado(0); 
      setDescuentoM2(1); // 1$ por m2 crédito base
      setDescuentoInicial(0); 
      setDescuentoContadoM2(3); // 3$ por m2 contado para Jardines y Renacer
    } else if (proyecto === "CAÑAVERAL") {
      setDescuentoCredito(0); setDescuentoContado(0); 
      setDescuentoM2(1); // 1$ por m2 crédito base
      setDescuentoInicial(0); 
      setDescuentoContadoM2(4); // 4$ por m2 contado
    } else if (proyecto === "OTRO") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    }
  }, [proyecto]);

  // EFECTO DINÁMICO: Ajuste automático de descuento a crédito según % o Monto Fijo de Cuota Inicial
  useEffect(() => {
    let pct = 0;

    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie);
      const prec = Number(precio);
      const monto = Number(inicialMonto);

      if (sup > 0 && prec > 0 && monto > 0) {
        const val_orig = sup * prec;
        const desc_m2_val = aplicarDescM2 ? Number(descuentoM2) : 0;
        const m_desc_m2 = sup * desc_m2_val;
        const val_post_desc_m2 = val_orig - m_desc_m2;
        
        const desc_cred_pct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
        const m_desc_cred = val_post_desc_m2 * desc_cred_pct;
        const base = val_post_desc_m2 - m_desc_cred;

        if (base > 0) {
          pct = (monto / base) * 100;
        }
      }
    }

    if (pct > 0) {
      if (proyecto === "MUYURINA" || proyecto === "SANTA FE") {
        if (pct >= 4.99) setDescuentoCredito(23);
        else setDescuentoCredito(20);
      } else if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto)) {
        if (pct >= 2.99) setDescuentoM2(2);
        else setDescuentoM2(1);
      }
    }
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, descuentoM2, descuentoCredito, aplicarDescM2, aplicarDescCreditoPct]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calcular = (e) => {
    if (e) e.preventDefault();
    
    const sup = Number(superficie);
    const prec = Number(precio);
    const ans = Number(años);
    
    const descCreditoPct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
    const descContadoPct = aplicarDescContadoPct ? (Number(descuentoContado) / 100) : 0;
    const descM2Val = aplicarDescM2 ? Number(descuentoM2) : 0;
    const descContadoM2Val = aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0;

    if (!sup || !prec || ans <= 0) {
      setResultado(null);
      return;
    }

    const valor_original = sup * prec;

    // --- CÁLCULO DE CRÉDITO ---
    let monto_descuento_m2 = sup * descM2Val;
    const valor_post_desc_m2 = valor_original - monto_descuento_m2;

    const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
    const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
    
    let cuota_inicial = 0;
    if (modoInicial === 'porcentaje') {
      cuota_inicial = base_para_inicial * (Number(inicialPorcentaje) / 100);
    } else {
      cuota_inicial = Number(inicialMonto);
    }

    let descIniVal = 0;
    if (proyecto === "OTRO" && aplicarBonoInicialOtro) {
       descIniVal = Math.min(Number(descuentoInicial), 500);
    }

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    

    // --- CÁLCULO DE CONTADO ---
    let monto_desc_contado_m2 = sup * descContadoM2Val;

    let monto_descuento_total_contado = 0;
    if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto)) {
      const monto_desc_contado_pct = valor_original * descContadoPct;
      monto_descuento_total_contado = monto_desc_contado_m2 + monto_desc_contado_pct;
    } else {
      const monto_desc_contado_pct = valor_post_desc_m2 * descContadoPct;
      monto_descuento_total_contado = monto_descuento_m2 + monto_desc_contado_pct + monto_desc_contado_m2;
    }
    const valor_contado = valor_original - monto_descuento_total_contado;

    // --- MATEMÁTICA DEL PRÉSTAMO ---
    const saldo = valor_credito - cuota_inicial;
    const meses = ans * 12;
    
    const tasa_anual = 0.121733; 
    const tasa = tasa_anual / 12;

    let pago_puro = 0;
    if (tasa === 0) {
      pago_puro = saldo / meses;
    } else {
      pago_puro = saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    }

    const refSaldo = 34278.00;
    const baseSeguro = {
      1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38
    };

    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;

    const seguro = saldo * factorSeguro;
    
    // CBDI ACTUALIZADO: Actualmente en CERO según nuevas directrices
    const cbdi = 0;
    
    const cuota_final = pago_puro + seguro + cbdi;

    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;

    setResultado({
      proyecto: nombreProyectoFinal,
      uv, mzn, lote, superficie: sup,
      valorOriginal: formatMoney(valor_original),
      valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      
      valorContado: formatMoney(valor_contado),
      valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0,
      descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      
      valorCredito: formatMoney(valor_credito),
      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      
      descuentoM2: aplicarDescM2 ? descM2Val : 0,
      descuentoInicial: descIniVal,
      
      inicial: formatMoney(cuota_inicial),
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO),
      pagoAmortizacion: formatMoney(pago_puro),
      seguro: formatMoney(seguro),
      cbdi: formatMoney(cbdi),
      mensual: formatMoney(cuota_final),
      mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans
    });
  };

  useEffect(() => {
    calcular();
  }, [modoInicial, aplicarBonoInicialOtro, aplicarDescContadoPct, aplicarDescCreditoPct, aplicarDescM2, aplicarDescContadoM2, superficie, precio, inicialPorcentaje, inicialMonto, años, descuentoContado, descuentoCredito, descuentoM2, descuentoInicial, descuentoContadoM2]);

  // Mensaje de WhatsApp
  const enviarWhatsApp = () => {
    if (!resultado) return;

    const saludo = "Estimado cliente, un gusto saludarle. Presento la propuesta de inversión:\n\n";
    
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado || 'S/N'}*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;

    const precioLista = `💎 *Precio:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    // --- Sección Contado ---
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    
    let isProyectosEspeciales = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isProyectosEspeciales ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    
    if (descM2ContadoVal > 0) {
        arrContado.push(`$${descM2ContadoVal}/m²`);
    }

    let contadoStr = "";
    if (arrContado.length > 0) {
        let textoDescContado = ` - ¡Con ${arrContado.join(' + ')} de descuento!`;
        contadoStr = `💰 *Contado${textoDescContado}*\n*Inversión:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n`;
    }

    // --- Sección Crédito ---
    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    if (resultado.descuentoInicial > 0) arrCredito.push(`Bono Inicial Doble`);
    
    let creditoStr = "";
    if (arrCredito.length > 0) {
        let textoDescCredito = ` - ¡Con ${arrCredito.join(' + ')} de descuento!`;
        creditoStr = `✅ *Crédito${textoDescCredito}*\n*Inversión:* $ ${resultado.valorCredito} (Bs. ${resultado.valorCreditoBs})\n\n`;
    }

    const financiamiento = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n` +
      `*Cuota inicial:* $${resultado.inicial} (Bs. ${resultado.inicialBs})\n` +
      `*Cuota mensual:* $${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;

    const cierre = `¿Le gustaría agendar una visita al terreno o prefiere una breve llamada para coordinar el cierre? Quedo a su disposición. 🤝`;

    const mensaje = saludo + ubicacion + precioLista + contadoStr + creditoStr + financiamiento + cierre;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const showDescPorcentaje = ["MUYURINA", "SANTA FE", "OTRO"].includes(proyecto);
  const showDescM2 = ["EL RENACER", "LOS JARDINES", "CAÑAVERAL", "OTRO"].includes(proyecto);
  const showBonoInicial = ["OTRO"].includes(proyecto);
  const showDescContadoM2 = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto);

  return (
    <div className="min-h-screen bg-[#f1f5f9] relative font-['Plus_Jakarta_Sans'] text-slate-800 overflow-hidden selection:bg-indigo-300 selection:text-indigo-900">
      
      {/* Estilos para animaciones custom */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        }
        .glass-input {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
        }
        .glass-input:focus {
          background: #ffffff;
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.01);
        }
      `}</style>

      {/* BACKGROUND ORBS - PREMIUM GRADIENTS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Marca de Agua Lateral */}
      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-300/40 font-black tracking-[0.5em] text-3xl select-none">
          CELINA PREMIUM
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        {/* CABECERA PREMIUM */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-12 gap-6">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white/80 shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-800">Plataforma Inteligente de Cierres</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm flex items-center gap-3">
              Cotizador <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Pro</span>
            </h1>
            <p className="text-slate-500 text-sm mt-3 font-medium tracking-wide">Diseñado por Oscar Saravia®</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* --- PANEL IZQUIERDO: FORMULARIO GLASS --- */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md relative z-10 border border-white/10">
                <FileText className="w-5 h-5 text-indigo-300" />
              </div>
              <h2 className="text-xl font-bold tracking-wide relative z-10">Datos de Inversión</h2>
            </div>
            
            <div className="p-7 sm:p-8">
              <form onSubmit={calcular} className="space-y-6">
                
                {/* PROYECTO */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" /> Proyecto
                  </label>
                  <select 
                    value={proyecto}
                    onChange={e => setProyecto(e.target.value)} 
                    className="w-full glass-input rounded-2xl p-4 outline-none transition-all font-bold text-slate-800 text-base cursor-pointer" 
                  >
                    <option value="MUYURINA">MUYURINA</option>
                    <option value="SANTA FE">SANTA FE</option>
                    <option value="EL RENACER">EL RENACER</option>
                    <option value="LOS JARDINES">LOS JARDINES</option>
                    <option value="CAÑAVERAL">CAÑAVERAL</option>
                    <option value="OTRO">OTRO...</option>
                  </select>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full glass-input rounded-2xl p-4 outline-none transition-all font-semibold text-slate-800 mt-3" 
                      placeholder="Escribe el nombre del proyecto..."
                    />
                  )}
                </div>

                {/* UV / MZN / LOTE */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">UV</label>
                    <input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Ej. 49" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">MZN</label>
                    <input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Ej. 6" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">LOTE</label>
                    <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Ej. 9" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold text-slate-700 transition-all" />
                  </div>
                </div>

                {/* SUP & PRECIO */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Map className="w-4 h-4 text-emerald-500" /> Superficie <span className="text-slate-400 normal-case">(m²)</span>
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className="w-full glass-input rounded-2xl p-4 font-extrabold text-slate-800 text-lg transition-all" />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Precio <span className="text-slate-400 normal-case">/ m²</span>
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className="w-full glass-input rounded-2xl p-4 font-extrabold text-slate-800 text-lg transition-all" />
                  </div>
                </div>

                {/* DESCUENTOS - PANEL PREMIUM */}
                <div className="bg-white/40 border border-white/60 p-5 rounded-[2rem] shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-300/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-colors"></div>
                  
                  <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <div className="bg-emerald-100 p-1.5 rounded-lg">
                      <Gift className="w-4 h-4 text-emerald-600" />
                    </div>
                    Descuentos Promocionales
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                            <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                            A Contado (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={e=>setDescuentoContado(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoPct ? 'glass-input text-slate-800' : 'bg-slate-100/40 border border-slate-200/50 text-slate-400 cursor-not-allowed'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                            <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                            A Crédito (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={e=>setDescuentoCredito(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescCreditoPct ? 'glass-input text-slate-800' : 'bg-slate-100/40 border border-slate-200/50 text-slate-400 cursor-not-allowed'}`} />
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                          {["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto) ? "Crédito x m² ($us)" : "Desc. x m² ($us)"}
                        </label>
                        <input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={e=>setDescuentoM2(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'glass-input text-slate-800' : 'bg-slate-100/40 border border-slate-200/50 text-slate-400 cursor-not-allowed'}`} />
                        {["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto) && <p className={`text-[10px] font-extrabold mt-1 ${aplicarDescM2 ? 'text-emerald-500' : 'text-slate-300'}`}>Sin límite</p>}
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                          Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={e=>setDescuentoContadoM2(e.target.value)} placeholder={["LOS JARDINES", "EL RENACER"].includes(proyecto) ? "Ej. 3" : "Ej. 4"} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'glass-input text-slate-800' : 'bg-slate-100/40 border border-slate-200/50 text-slate-400 cursor-not-allowed'}`} />
                        <p className={`text-[10px] font-extrabold mt-1 ${aplicarDescContadoM2 ? 'text-emerald-500' : 'text-slate-300'}`}>Sin límite</p>
                      </div>
                    )}
                    {showBonoInicial && proyecto === "OTRO" && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                          Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" max="500" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={e=>{
                          let v = Number(e.target.value);
                          setDescuentoInicial(v > 500 ? 500 : v);
                        }} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarBonoInicialOtro ? 'glass-input text-slate-800' : 'bg-slate-100/40 border border-slate-200/50 text-slate-400 cursor-not-allowed'}`} />
                        <p className={`text-[10px] font-extrabold mt-1 ${aplicarBonoInicialOtro ? 'text-emerald-500' : 'text-slate-300'}`}>Máx. permitido $500</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-indigo-50/50 border border-indigo-100/60 p-4 rounded-2xl grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''}
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 1.5'}
                        className="w-full bg-white/90 border border-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-700 text-base shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'monto' ? inicialMonto : ''}
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className="w-full bg-white/90 border border-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all font-black text-indigo-700 text-base shadow-sm" 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-1 md:mt-0">
                      <Calendar className="w-4 h-4 text-indigo-500" /> Plazo
                    </label>
                    <div className="relative">
                      <select 
                        required 
                        value={años} 
                        onChange={e => setAños(e.target.value)} 
                        className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-slate-800 text-base appearance-none pr-10 cursor-pointer h-full"
                      >
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500">
                        <ChevronRight className="w-5 h-5 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.6)] hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.8)] hover:-translate-y-1 border border-white/10 uppercase tracking-wide text-lg"
                >
                  Procesar Cotización <TrendingUp className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>

          {/* --- PANEL DERECHO: RESULTADOS PREMIUM --- */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {!resultado ? (
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[600px] flex flex-col items-center justify-center text-slate-400 p-10 text-center transition-all duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200/50 rounded-full blur-2xl animate-pulse"></div>
                  <div className="bg-white p-8 rounded-full mb-8 shadow-xl border border-slate-100 relative z-10">
                    <Calculator className="w-16 h-16 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-700 tracking-tight mb-3">Plataforma Activa</h3>
                <p className="text-base max-w-md text-slate-500 font-medium leading-relaxed">Completa los parámetros de inversión a la izquierda para generar una propuesta financiera detallada y lista para el cliente.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2.5rem] p-7 sm:p-10 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] border border-white/80">
                  
                {/* Resplandores internos */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-6 border-b border-slate-200/60 gap-4 relative z-10">
                  <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    Propuesta Oficial
                  </h2>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Aprobada
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
                      <div className="flex items-center gap-4 pl-2">
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3.5 rounded-xl border border-indigo-100">
                          <MapPin className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Desarrollo Urbanístico</div>
                          <div className="text-slate-800 font-black text-xl uppercase leading-none tracking-tight">{resultado.proyecto || 'S/N'}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="text-center px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">UV</div>
                          <div className="text-slate-700 font-black text-lg leading-none">{resultado.uv || '-'}</div>
                        </div>
                        <div className="text-center px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">MZN</div>
                          <div className="text-slate-700 font-black text-lg leading-none">{resultado.mzn || '-'}</div>
                        </div>
                        <div className="text-center px-5 py-2.5 bg-slate-800 rounded-xl shadow-lg shadow-slate-800/20 border border-slate-700">
                          <div className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">LOTE</div>
                          <div className="text-white font-black text-lg leading-none">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado */}
                  <div className="bg-gradient-to-br from-white to-slate-50 p-7 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between sm:items-end gap-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-2">
                        Precio de Lista Original
                      </span>
                      <div className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">$ {resultado.valorOriginal}</div>
                      <div className="text-sm font-bold text-slate-400 mt-1.5">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-50/80 backdrop-blur-md text-emerald-700 px-5 py-3 rounded-2xl border border-emerald-200/60 shadow-sm relative z-10">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest mb-1 text-emerald-600/80 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                        <div className="text-xl font-black tracking-tight">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="bg-white/80 backdrop-blur-md p-7 rounded-[2rem] border border-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                      <span className="text-indigo-400/80 text-xs font-extrabold uppercase tracking-widest">Total a Financiar</span>
                      <div className="text-3xl font-black text-slate-800 tracking-tight mt-2 drop-shadow-sm">$ {resultado.valorCredito}</div>
                      
                      {resultado.ahorroCredito !== "0.00" && (
                          <div className="mt-3 text-[10px] text-indigo-600 font-extrabold bg-indigo-50/80 inline-block px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                            Ahorro Incluido: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>

                    <div className="bg-white/80 backdrop-blur-md p-7 rounded-[2rem] border border-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
                      <span className="text-emerald-400/80 text-xs font-extrabold uppercase tracking-widest">Cuota Inicial</span>
                      <div className="text-3xl font-black text-slate-800 tracking-tight mt-2 drop-shadow-sm">$ {resultado.inicial}</div>
                      <div className="text-sm font-bold text-slate-400 mt-1">Bs. {resultado.inicialBs}</div>
                    </div>
                  </div>

                  {/* Fila: Cuota Mensual ESTILO VIP CARD */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(30,27,75,0.6)] border border-indigo-500/30 group mt-4">
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute top-0 right-0 w-48 h-full bg-white/5 skew-x-12 transform translate-x-10 pointer-events-none"></div>
                    
                    <span className="text-indigo-200/80 text-[11px] font-extrabold uppercase tracking-widest relative z-10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      Cuota Mensual Fija ({resultado.plazo} Años)
                    </span>
                    <div className="flex items-baseline gap-4 mt-3 flex-wrap relative z-10">
                      <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg">$ {resultado.mensual}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-indigo-300">Bs. {resultado.mensualBs}</div>
                    </div>
                    <div className="text-xs text-indigo-200/60 mt-6 font-semibold tracking-wide relative z-10 flex gap-4 border-t border-white/10 pt-4">
                      <span>Amort. ${resultado.pagoAmortizacion}</span>
                      <span className="w-1 h-1 rounded-full bg-indigo-500/50 my-auto"></span>
                      <span>Seguro ${resultado.seguro}</span>
                      <span className="w-1 h-1 rounded-full bg-indigo-500/50 my-auto"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="mt-8 pt-6 border-t border-slate-200/60">
                    <button
                      onClick={enviarWhatsApp}
                      className="w-full bg-gradient-to-r from-[#20bd5a] to-[#25D366] hover:from-[#1da850] hover:to-[#20bd5a] text-white font-black py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_25px_-10px_rgba(37,211,102,0.6)] hover:shadow-[0_15px_30px_-10px_rgba(37,211,102,0.8)] hover:-translate-y-1 text-lg uppercase tracking-wider relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                      <Send className="w-6 h-6 relative z-10" /> 
                      <span className="relative z-10">Enviar Propuesta por WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
