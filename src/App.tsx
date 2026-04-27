import React, { useState, useEffect, useRef } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Building2, ChevronRight, FileText, Tag, MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, Scale, TableProperties, UserCircle, BadgeCheck, X, Activity, Lock, Copy, RefreshCw, Check, MessageSquareText, Database, Edit3, Printer, BarChart3, Star, Flame, LayoutDashboard, Save, Briefcase, Users, FolderOpen } from "lucide-react";

// --- COMPONENTE DE ANIMACIÓN DE NÚMEROS ---
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime;
    const startValue = displayValue;
    const duration = 800;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 
      setDisplayValue(startValue + (value - startValue) * ease);
      if (progress < 1) window.requestAnimationFrame(step);
      else setDisplayValue(value);
    };
    if (startValue !== value) window.requestAnimationFrame(step);
  }, [value]);

  return <>{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(displayValue)}</>;
};

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y PERFILES ---
  const [userRole, setUserRole] = useState(null); // null, 'asesor', 'gerente'
  const [currentView, setCurrentView] = useState("simulador"); // 'simulador', 'dashboard'
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "MVENTAS26") {
      setUserRole("asesor");
      setLoginError("");
    } else if (passwordInput === "GERENCIA26") {
      setUserRole("gerente");
      setLoginError("");
    } else {
      setLoginError("Contraseña incorrecta. Intente nuevamente.");
    }
  };

  // --- ESTADOS DE BASE DE DATOS (CRM LOCAL) ---
  const [historialCRM, setHistorialCRM] = useState([]);

  useEffect(() => {
    const dataGuardada = localStorage.getItem('celina_crm_data');
    if (dataGuardada) setHistorialCRM(JSON.parse(dataGuardada));
  }, []);

  // --- ESTADOS DE DATOS DE LOTES ---
  const [lotesDB, setLotesDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        if (window.location.protocol === 'blob:' || window.location.origin === 'null') throw new Error("ENTORNO_VISTA_PREVIA");
        const response = await fetch('/lotes.json');
        if (!response.ok) throw new Error("ERROR_404");
        const text = await response.text();
        try {
          const rawData = JSON.parse(text);
          const dataArray = Array.isArray(rawData) ? rawData : [];
          const normalizedData = dataArray.map(item => {
            const rawKeys = Object.keys(item);
            const getValue = (matchWords, highPriorityWords = [], avoidWords = []) => {
                let bestKey = null; let bestScore = -1;
                rawKeys.forEach(k => {
                    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let score = 0;
                    matchWords.forEach(w => { if (cleanKey.includes(w)) score += 10; });
                    highPriorityWords.forEach(w => { if (cleanKey.includes(w)) score += 50; });
                    avoidWords.forEach(w => { if (cleanKey.includes(w)) score -= 100; });
                    if (score > bestScore && score > 0) { bestScore = score; bestKey = k; }
                });
                return bestKey ? item[bestKey] : "";
            };
            let rawProyecto = String(getValue(['proyecto', 'urbanizacion', 'celina']) || "");
            let cleanProyecto = rawProyecto.toUpperCase().replace('CELINA ', '').replace('CELINA', '').trim();
            const cleanNumber = (val) => {
                if (val === undefined || val === null || val === "") return "";
                if (typeof val === 'number') return val;
                let strVal = String(val).replace(/[^0-9.,]/g, '');
                if (strVal.includes(',') && strVal.includes('.')) strVal = strVal.indexOf(',') > strVal.indexOf('.') ? strVal.replace(/\./g, '').replace(',', '.') : strVal.replace(/,/g, ''); 
                else if (strVal.includes(',')) strVal = strVal.replace(',', '.'); 
                const num = Number(strVal); return isNaN(num) ? "" : num;
            };
            return {
                proyecto: cleanProyecto,
                uv: String(getValue(['uv']) || "").toUpperCase().replace('UV:', '').trim(),
                mzn: String(getValue(['mzn', 'manzano']) || "").toUpperCase().replace('MZN:', '').trim(),
                lote: String(getValue(['lote']) || "").toUpperCase().replace('LOTE:', '').trim(),
                categoria: String(getValue(['categoria', 'cat']) || "Estándar"),
                superficie: cleanNumber(getValue(['superficie', 'sup', 'area'], ['m2', 'mt2'], ['precio', 'costo', 'valor'])),
                precio: cleanNumber(getValue(['precio', 'valor', 'costo'], ['m2', 'mt2', 'unitario', 'lista'], ['total', 'final', 'contado', 'credito'])) 
            };
          });
          const validLotes = normalizedData.filter(l => l.proyecto && l.lote);
          setLotesDB(validLotes); setDbError(null);
        } catch (e) { throw new Error("ERROR_JSON"); }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "ERROR_404") setDbError("❌ Falta el archivo lotes.json.");
          else if (error.message === "ERROR_JSON") setDbError("⚠️ Error de formato en lotes.json.");
          else if (error.message === "ENTORNO_VISTA_PREVIA" || error.name === "TypeError") setDbError("⚠️ Entorno de previsualización activo.");
          else setDbError("❌ Error de red.");
        }
        setLotesDB([]); 
      } finally { setLoading(false); }
    };
    fetchLotes();
  }, []);

  const proyectosDesdeDB = [...new Set(lotesDB.map(l => l.proyecto))].filter(Boolean).sort();
  const proyectosOptions = proyectosDesdeDB.length > 0 ? proyectosDesdeDB : ["MUYURINA", "SANTA FE", "EL RENACER", "LOS JARDINES", "CAÑAVERAL", "RANCHO NUEVO"];

  const [proyecto, setProyecto] = useState(proyectosOptions[0] || "MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [nombreAsesor, setNombreAsesor] = useState("");
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [categoriaLote, setCategoriaLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); 

  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(true);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(true);
  const [aplicarDescM2, setAplicarDescM2] = useState(true);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(true);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(true);

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);

  const [escenarioA, setEscenarioA] = useState(null);
  const [showComparativa, setShowComparativa] = useState(false);
  const [showTablaPagos, setShowTablaPagos] = useState(false);
  
  const [modoManual, setModoManual] = useState(false);
  const resultsRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // --- HELPER: SEMÁFORO DE DISPONIBILIDAD (GATILLO DE ESCASEZ) ---
  const getLoteStatus = (cat) => {
    const c = String(cat).toUpperCase();
    if (c.includes("ESQUINA") || c.includes("PARQUE") || c.includes("AVENIDA") || c.includes("COMERCIAL") || c.includes("VIP") || c.includes("ESTRATEGICO") || c.includes("ESTRATÉGICO") || c.includes("ESPECIAL")) {
      return { type: 'premium', icon: <Star className="w-5 h-5 text-amber-400" />, text: "Lote Estratégico", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", desc: "Alta demanda por ubicación privilegiada." };
    }
    return { type: 'hot', icon: <Flame className="w-5 h-5 text-rose-400" />, text: "Alta Demanda", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", desc: "Últimos lotes disponibles en esta manzana." };
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado(""); setEscenarioA(null); setShowTablaPagos(false); setIsSaved(false);
    setAplicarDescContadoPct(true); setAplicarDescCreditoPct(true); setAplicarDescM2(true); setAplicarDescContadoM2(true); setAplicarBonoInicialOtro(true);

    if (proyecto === "MUYURINA") {
      setDescuentoCredito(20); setDescuentoContado(30); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    } else if (["EL RENACER", "LOS JARDINES", "RANCHO NUEVO", "SANTA FE"].includes(proyecto)) {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(1); setDescuentoInicial(0); setDescuentoContadoM2(3);
    } else if (proyecto === "CAÑAVERAL") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(1); setDescuentoInicial(0); setDescuentoContadoM2(4);
    } else if (proyecto === "OTRO") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0); setModoManual(true);
    }
    if (proyecto !== "OTRO") setModoManual(lotesDB.length === 0);
  }, [proyecto, lotesDB.length]);

  const uvsDisponibles = [...new Set(lotesDB.filter(l => l.proyecto === proyecto).map(l => l.uv))].sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  const mznsDisponibles = [...new Set(lotesDB.filter(l => l.proyecto === proyecto && String(l.uv) === String(uv)).map(l => l.mzn))].sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  const lotesDisponibles = lotesDB.filter(l => l.proyecto === proyecto && String(l.uv) === String(uv) && String(l.mzn) === String(mzn)).sort((a,b) => String(a.lote).localeCompare(String(b.lote), undefined, {numeric: true}));

  const handleUvChange = (e) => { setUv(e.target.value); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote(""); };
  const handleMznChange = (e) => { setMzn(e.target.value); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote(""); };
  const handleLoteChange = (e) => {
    const selectedLote = e.target.value; setLote(selectedLote);
    const loteData = lotesDisponibles.find(l => String(l.lote) === String(selectedLote));
    if (loteData) {
      if (loteData.superficie) setSuperficie(loteData.superficie);
      if (loteData.precio) setPrecio(loteData.precio);
      setCategoriaLote(loteData.categoria || "Estándar"); 
    }
  };

  useEffect(() => {
    let pct = 0;
    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie); const prec = Number(precio); const monto = Number(inicialMonto);
      if (sup > 0 && prec > 0 && monto > 0) {
        const base = (sup * prec) - (sup * (aplicarDescM2 ? Number(descuentoM2) : 0));
        const finalBase = base - (base * (aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0));
        if (finalBase > 0) pct = (monto / finalBase) * 100;
      }
    }
    
    if (pct > 0) {
      if (proyecto === "MUYURINA") {
        if (pct >= 4.99) setDescuentoCredito(23); else setDescuentoCredito(20);
      } else if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO", "SANTA FE"].includes(proyecto)) {
        if (pct >= 5) setDescuentoM2(2); else setDescuentoM2(1);
      }
    }
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, descuentoM2, descuentoCredito, aplicarDescM2, aplicarDescCreditoPct]);

  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const calcular = (e) => {
    if (e) e.preventDefault();
    const sup = Number(superficie); const prec = Number(precio); const ans = Number(años);
    const descCreditoPct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
    const descContadoPct = aplicarDescContadoPct ? (Number(descuentoContado) / 100) : 0;
    const descM2Val = aplicarDescM2 ? Number(descuentoM2) : 0;
    const descContadoM2Val = aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0;

    if (!sup || !prec || ans <= 0) return setResultado(null);

    const valor_original = sup * prec;
    let monto_descuento_m2 = sup * descM2Val;
    const valor_post_desc_m2 = valor_original - monto_descuento_m2;
    const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
    const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
    
    let cuota_inicial = 0; let pct_inicial_real = 0;
    if (modoInicial === 'porcentaje') {
      pct_inicial_real = Number(inicialPorcentaje);
      cuota_inicial = base_para_inicial * (pct_inicial_real / 100);
    } else {
      cuota_inicial = Number(inicialMonto);
      pct_inicial_real = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
    }

    let descIniVal = 0;
    if (proyecto === "OTRO" && aplicarBonoInicialOtro) descIniVal = Math.min(Number(descuentoInicial), 500);

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    
    let monto_desc_contado_m2 = sup * descContadoM2Val;
    let monto_descuento_total_contado = 0;
    if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(proyecto)) {
      monto_descuento_total_contado = monto_desc_contado_m2 + (valor_original * descContadoPct);
    } else {
      monto_descuento_total_contado = monto_descuento_m2 + (valor_post_desc_m2 * descContadoPct) + monto_desc_contado_m2;
    }
    const valor_contado = valor_original - monto_descuento_total_contado;

    const saldo = valor_credito - cuota_inicial;
    const meses = ans * 12;
    const tasa = 0.121733 / 12;

    const refSaldo = 34278.00;
    const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38 };
    
    let pago_puro = tasa === 0 ? (saldo / meses) : (saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1));
    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;
    const seguro = saldo * factorSeguro;
    const cbdi = 0; 
    const cuota_final = pago_puro + seguro + cbdi;
    const total_pagado_credito = cuota_inicial + (cuota_final * meses);

    const tablaPlazos = [];
    const TIPO_CAMBIO = 6.97;

    for (let i = 10; i >= 1; i--) {
        const m = i * 12;
        let p_puro_i = tasa === 0 ? (saldo / m) : (saldo * (tasa * Math.pow(1 + tasa, m)) / (Math.pow(1 + tasa, m) - 1));
        const fSeguro_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 / refSaldo);
        const seg_i = saldo * fSeguro_i;
        const c_final_i = p_puro_i + seg_i + cbdi;
        
        tablaPlazos.push({ años: i, meses: m, cuota_inicial: formatMoney(cuota_inicial), cuota_mensual: formatMoney(c_final_i), cuota_mensual_bs: formatMoney(c_final_i * TIPO_CAMBIO) });
    }

    const tasaPlusvaliaAnual = 0.12; 
    const proyeccionPlusvalia = [];
    const valorBaseInversion = valor_original; 
    let maxValuePlusvalia = valorBaseInversion * Math.pow(1 + tasaPlusvaliaAnual, ans);

    let intervalos = [];
    if (ans <= 5) {
        for (let i = 0; i <= ans; i++) intervalos.push(i);
    } else {
        intervalos = [0, 2, Math.floor(ans/2), ans-2, ans];
        intervalos = [...new Set(intervalos)].sort((a,b)=>a-b); 
    }

    intervalos.forEach(i => {
       let valorAnio = valorBaseInversion * Math.pow(1 + tasaPlusvaliaAnual, i);
       proyeccionPlusvalia.push({
           anio: i,
           etiqueta: i === 0 ? "Hoy" : `Año ${i}`,
           valor: valorAnio,
           valorFormat: formatMoney(valorAnio),
           alturaPorcentaje: (valorAnio / maxValuePlusvalia) * 100
       });
    });

    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    setResultado({
      proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, precioM2: prec, fecha: fechaActual,
      categoria: categoriaLote || "Estándar",
      cliente: nombreCliente || 'Cliente Preferencial', asesor: nombreAsesor,
      valorOriginalRaw: valor_original, valorContadoRaw: valor_contado,
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0, descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      valorCreditoRaw: valor_credito, inicialRaw: cuota_inicial, mensualRaw: cuota_final, mensualBsRaw: cuota_final * TIPO_CAMBIO,
      saldoFinanciarRaw: saldo, totalPagadoCreditoRaw: total_pagado_credito,
      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0, descuentoM2: aplicarDescM2 ? descM2Val : 0, descuentoInicial: descIniVal,
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO), inicial: formatMoney(cuota_inicial),
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      plazo: ans, meses: meses, pctInicial: parseFloat(pct_inicial_real.toFixed(2)),
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO), tablaPlazos: tablaPlazos,
      proyeccionPlusvalia: proyeccionPlusvalia
    });

    setIsSaved(false);
    setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const guardarEnCRM = () => {
    if (!resultado) return;
    const nuevaData = {
      id: Date.now(),
      fecha: new Date().toLocaleString(),
      cliente: resultado.cliente,
      asesor: resultado.asesor || "Asesor No Identificado",
      proyecto: resultado.proyecto,
      ubicacion: `UV:${resultado.uv || '-'} MZN:${resultado.mzn || '-'} L:${resultado.lote || '-'}`,
      montoFinanciado: resultado.valorCreditoRaw
    };
    
    const nuevoHistorial = [nuevaData, ...historialCRM];
    setHistorialCRM(nuevoHistorial);
    localStorage.setItem('celina_crm_data', JSON.stringify(nuevoHistorial));
    setIsSaved(true);
    
    // Aquí a futuro se conecta con un Fetch POST a Google Sheets o un Webhook.
  };

  const generarMensajeParte1 = () => {
    if (!resultado) return "";
    return `Estimado(a) *${resultado.cliente}*, un gusto saludarle. Soy ${resultado.asesor || 'su Asesor Comercial'}.\n\n` +
           `🌱 _"Las cosas grandes, comienzan con un inicio pequeño"_.\nEsta frase de nuestro fundador, Rafael Paz, define exactamente lo que representa este paso: un terreno es el inicio seguro para el gran sueño de su familia.\n\n` +
           `🏆 Al invertir con *CELINA*, usted cuenta con el respaldo absoluto del *GRUPO PAZ*, reconocido este 2026 como una de las *5 Mejores Empresas para Trabajar en toda Bolivia*.`;
  };

  const generarMensajeParte2 = () => {
    if (!resultado) return "";
    const inicio = `Me enorgullece presentarle su propuesta oficial:\n\n`;
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const ubicacion = `📍 *PROYECTO ${nombreProyectoCapitalizado || 'S/N'}*\n🏷️ Categoría: ${resultado.categoria}\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;
    const precioLista = `💎 *Precio de Lista Original:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    let isProyectosEspeciales = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO", "SANTA FE"].includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isProyectosEspeciales ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    if (descM2ContadoVal > 0) arrContado.push(`$${descM2ContadoVal}/m²`);

    let contadoStr = "";
    if (resultado.valorContadoRaw < resultado.valorOriginalRaw) {
        contadoStr = arrContado.length > 0 ? `💰 *Opción 1: Al Contado - ¡Con ${arrContado.join(' + ')} de descuento!*\n*Inversión Final:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n` : `💰 *Opción 1: Al Contado*\n*Inversión Final:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n`;
    }

    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    
    let creditoStr = "";
    const tituloCredito = contadoStr !== "" ? "✅ *Opción 2: A Plazos" : "💳 *Opción de Financiamiento";
    creditoStr = arrCredito.length > 0 ? `${tituloCredito} - ¡Con ${arrCredito.join(' + ')} de descuento!*\n*Total a Financiar:* $ ${formatMoney(resultado.valorCreditoRaw)} (Bs. ${resultado.valorCreditoBs})\n\n` : `${tituloCredito}*\n*Total a Financiar:* $ ${formatMoney(resultado.valorCreditoRaw)} (Bs. ${resultado.valorCreditoBs})\n\n`;

    const financiamiento = `📊 *Plan de Pagos* (${resultado.plazo} años)\n` +
      `*Cuota inicial (${resultado.pctInicial}%):* $${formatMoney(resultado.inicialRaw)} (Bs. ${resultado.inicialBs})\n` +
      `*Cuota mensual fija:* $${formatMoney(resultado.mensualRaw)} (Bs. ${formatMoney(resultado.mensualBsRaw)})\n\n`;

    const plusvalia = `📈 *Plusvalía Proyectada (12% anual est.):*\nSu terreno de $${resultado.valorOriginal} proyecta alcanzar un valor de *+$${resultado.proyeccionPlusvalia[resultado.proyeccionPlusvalia.length-1].valorFormat}* al finalizar su plan de ${resultado.plazo} años. ¡No solo compra tierra, asegura su patrimonio!\n\n`;

    const cierre = `¿Le gustaría agendar una visita al terreno para dar ese "pequeño inicio" hacia su gran proyecto? Quedo a su entera disposición. 🤝`;
    return inicio + ubicacion + precioLista + contadoStr + creditoStr + financiamiento + plusvalia + cierre;
  };

  const enviarWhatsAppParte1 = () => window.open(`https://wa.me/?text=${encodeURIComponent(generarMensajeParte1())}`, '_blank');
  const enviarWhatsAppParte2 = () => window.open(`https://wa.me/?text=${encodeURIComponent(generarMensajeParte2())}`, '_blank');
  const copiarTextoTodo = () => {
    const mensaje = generarMensajeParte1() + "\n\n" + generarMensajeParte2();
    const textArea = document.createElement("textarea"); textArea.value = mensaje; document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) {} document.body.removeChild(textArea);
  };

  const handleReset = () => {
    setResultado(null); setEscenarioA(null); setShowComparativa(false); setShowTablaPagos(false); setIsSaved(false);
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
    setAños(""); setInicialMonto(""); setInicialPorcentaje(""); setNombreCliente(""); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generarPDF = () => {
    setShowTablaPagos(true); 
    setTimeout(() => { window.print(); }, 300);
  };

  const showDescPorcentaje = ["MUYURINA", "OTRO"].includes(proyecto);
  const showDescM2 = ["EL RENACER", "LOS JARDINES", "CAÑAVERAL", "RANCHO NUEVO", "SANTA FE", "OTRO"].includes(proyecto);
  const showBonoInicial = ["OTRO"].includes(proyecto);
  const showDescContadoM2 = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO", "SANTA FE"].includes(proyecto);

  if (loading) return <div className="min-h-screen bg-[#0B1121] flex items-center justify-center"><RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" /></div>;

  return (
    <div className="min-h-screen bg-[#0B1121] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-100">
      
      {/* MAGIA CSS PARA LA IMPRESIÓN (PDF) */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0B1121; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        
        .glass-panel-left { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(51, 65, 85, 0.5); box-shadow: 0 0 30px -5px rgba(6, 182, 212, 0.15); }
        .glass-panel-right { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(51, 65, 85, 0.5); box-shadow: 0 0 30px -5px rgba(52, 211, 153, 0.1); }
        .glass-input { background: rgba(11, 17, 33, 0.6); border: 1px solid rgba(51, 65, 85, 0.8); color: #e2e8f0; }
        .glass-input:focus { border-color: #06b6d4; outline: none; }

        @media print {
          body, html { background: white !important; min-height: auto !important; }
          .print-hide, .glass-panel-left, .fixed, header { display: none !important; }
          .lg\\:col-span-7 { width: 100% !important; max-width: 100% !important; flex: none !important; }
          .glass-panel-right { box-shadow: none !important; border: none !important; background: white !important; padding: 0 !important; color: black !important; }
          .bg-\\[\\#0F172A\\], .bg-\\[\\#1E293B\\] { background: white !important; border: 1px solid #e2e8f0 !important; }
          * { text-shadow: none !important; }
          .text-white, .text-slate-300, .text-slate-400, .text-slate-500 { color: #1e293b !important; }
          .text-cyan-400 { color: #0891b2 !important; }
          .text-emerald-400 { color: #059669 !important; }
          @page { margin: 1cm; size: auto; }
        }
      `}} />

      {/* FONDO GLOBAL OSCURO */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none print-hide">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1121]/90 via-[#0B1121]/95 to-[#0B1121]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[35rem] h-[35rem] bg-emerald-900/20 rounded-full mix-blend-screen filter blur-[100px]"></div>
      </div>

      {!userRole ? (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-20 px-4 bg-[#0B1121]/95 backdrop-blur-xl">
          <div className="bg-[#121A2F] border border-slate-700/30 rounded-[2.5rem] p-10 sm:p-14 max-w-[420px] w-full text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            <div className="w-[4.5rem] h-[4.5rem] mx-auto bg-gradient-to-b from-[#38bdf8] to-[#2563eb] rounded-[1.25rem] flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Acceso VIP</h1>
            <p className="text-slate-400/80 text-[10px] font-bold uppercase tracking-[0.15em] mb-10">Uso Exclusivo Máquina de<br />Ventas</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="CONTRASEÑA" className="w-full bg-[#0B1120] border border-slate-700/50 rounded-2xl p-4 text-center text-sm tracking-[0.2em] font-bold text-white outline-none" />
                {loginError && <p className="text-rose-400 text-xs font-bold mt-3">{loginError}</p>}
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#38bdf8] to-[#2563eb] text-white font-extrabold py-4 px-6 rounded-2xl uppercase text-sm flex items-center justify-center gap-2">INGRESAR <ChevronRight className="w-5 h-5" /></button>
            </form>
          </div>
        </div>
      ) : (
      <div className="max-w-[1200px] mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* BARRA DE NAVEGACIÓN GERENCIAL (Oculta para asesores normales) */}
        {userRole === "gerente" && (
          <nav className="bg-[#1E293B]/80 backdrop-blur-lg border border-cyan-900/50 rounded-2xl p-2 flex justify-center gap-2 mb-8 print-hide w-max mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <button onClick={() => setCurrentView("simulador")} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${currentView === "simulador" ? "bg-cyan-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
               <Calculator className="w-4 h-4" /> Simulador de Ventas
            </button>
            <button onClick={() => setCurrentView("dashboard")} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${currentView === "dashboard" ? "bg-emerald-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
               <LayoutDashboard className="w-4 h-4" /> Panel CRM Gerencial
            </button>
          </nav>
        )}

        {currentView === "dashboard" && userRole === "gerente" ? (
          /* --- PANTALLA: PANEL DE CONTROL GERENCIAL --- */
          <div className="animate-in fade-in zoom-in-95 duration-500">
             <div className="flex flex-col items-center mb-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(52,211,153,0.3)]"><Briefcase className="w-7 h-7 text-white" /></div>
                <h1 className="text-4xl font-extrabold text-white">Panel de Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">CRM</span></h1>
                <p className="text-slate-400 text-sm font-medium tracking-wide mt-1">Gestión Regional Montero</p>
             </div>

             {/* KPIs (Indicadores Clave) */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-xl">
                    <div className="flex items-center gap-3 mb-2 text-cyan-400"><FolderOpen className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Cotizaciones Generadas</span></div>
                    <div className="text-4xl font-black text-white">{historialCRM.length}</div>
                </div>
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-emerald-900/50 p-6 rounded-[2rem] shadow-[0_0_30px_rgba(52,211,153,0.05)]">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400"><DollarSign className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Volumen Financiado</span></div>
                    <div className="text-4xl font-black text-white">$ {formatMoney(historialCRM.reduce((acc, curr) => acc + (curr.montoFinanciado || 0), 0))}</div>
                </div>
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-xl">
                    <div className="flex items-center gap-3 mb-2 text-purple-400"><Users className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Asesores Activos</span></div>
                    <div className="text-4xl font-black text-white">{[...new Set(historialCRM.map(h => h.asesor))].length}</div>
                </div>
             </div>

             {/* Tabla de Base de Datos */}
             <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-700 rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#1E293B]/30">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2"><Database className="w-5 h-5 text-cyan-500"/> Registro de Actividad</h3>
                   <span className="bg-cyan-900/40 text-cyan-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase border border-cyan-500/30">Datos en Tiempo Real</span>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs text-slate-500 uppercase bg-[#0B1121]">
                         <tr>
                            <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                            <th className="px-6 py-4 font-bold">Cliente</th>
                            <th className="px-6 py-4 font-bold">Asesor</th>
                            <th className="px-6 py-4 font-bold">Proyecto</th>
                            <th className="px-6 py-4 font-bold">Ubicación</th>
                            <th className="px-6 py-4 font-bold text-right text-emerald-400">Financiado ($us)</th>
                         </tr>
                      </thead>
                      <tbody>
                         {historialCRM.length === 0 ? (
                           <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">No hay cotizaciones registradas aún.</td></tr>
                         ) : (
                           historialCRM.map((row) => (
                             <tr key={row.id} className="border-b border-slate-800/50 hover:bg-[#1E293B]/50 transition-colors">
                                <td className="px-6 py-4">{row.fecha}</td>
                                <td className="px-6 py-4 font-bold text-white">{row.cliente || "Sin nombre"}</td>
                                <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{row.asesor}</span></td>
                                <td className="px-6 py-4 text-cyan-400 font-bold">{row.proyecto}</td>
                                <td className="px-6 py-4 text-xs">{row.ubicacion}</td>
                                <td className="px-6 py-4 text-right font-black text-emerald-400">${formatMoney(row.montoFinanciado)}</td>
                             </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        ) : (
          /* --- PANTALLA: SIMULADOR DE VENTAS NORMAL --- */
          <>
            <header className="flex flex-col items-center mb-10 print-hide">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Cotizador <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pro</span></h1>
              </div>
              <p className="text-slate-400 text-sm font-medium tracking-wide">Diseñado por Oscar Saravia®</p>
            </header>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              
              {/* PANEL IZQUIERDO: FORMULARIO */}
              <div className="lg:col-span-5 glass-panel-left rounded-[2.5rem] overflow-hidden transition-all duration-500 relative print-hide">
                <div className="p-6 sm:p-8 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="bg-[#1E293B] p-2.5 rounded-xl border border-slate-600/50"><FileText className="w-5 h-5 text-cyan-400" /></div><h2 className="text-lg font-bold text-white">Datos de Inversión</h2></div>
                  <button type="button" onClick={handleReset} className="p-2.5 bg-[#0F172A] hover:bg-[#1e293b] rounded-xl border border-slate-700/80 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
                </div>
                
                <div className="p-6 sm:p-8 bg-[#0F172A]/40">
                  <form onSubmit={calcular} className="space-y-6">
                    <div className="space-y-4 bg-[#1E293B]/30 p-5 rounded-2xl border border-cyan-900/30">
                      <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Cliente (Opcional)</label><input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Ej. Juan Pérez" className="w-full glass-input rounded-xl p-3 text-sm" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Asesor</label><input type="text" value={nombreAsesor} onChange={e => setNombreAsesor(e.target.value)} placeholder="Tu Nombre Completo" className="w-full glass-input rounded-xl p-3 text-sm" /></div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-500" /> Proyecto</label>
                        {proyecto !== "OTRO" && lotesDB.length > 0 && (
                          <button type="button" onClick={() => setModoManual(!modoManual)} className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1.5 border ${modoManual ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'}`}>
                            {modoManual ? <><Edit3 className="w-3 h-3"/> Ingreso Manual</> : <><Database className="w-3 h-3"/> Búsqueda Inteligente</>}
                          </button>
                        )}
                      </div>
                      <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold text-white text-base cursor-pointer">
                        {proyectosOptions.map(p => <option key={p} value={p}>{p}</option>)} <option value="OTRO">OTRO...</option>
                      </select>
                      {proyecto === "OTRO" && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} placeholder="Nombre del proyecto..." className="w-full glass-input rounded-2xl p-4 text-sm font-bold text-white mt-2" required />}
                    </div>

                    {!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? (
                      <div className="bg-cyan-900/10 p-4 rounded-2xl border border-cyan-500/30 grid grid-cols-3 gap-3">
                        <div className="space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">UV</label><select value={uv} onChange={handleUvChange} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white text-sm"><option value="" disabled hidden>---</option>{uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">MZN</label><select value={mzn} onChange={handleMznChange} disabled={!uv} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white text-sm disabled:opacity-50"><option value="" disabled hidden>---</option>{mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">LOTE</label><select value={lote} onChange={handleLoteChange} disabled={!mzn} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white text-sm disabled:opacity-50"><option value="" disabled hidden>---</option>{lotesDisponibles.map(l => <option key={l.lote} value={l.lote}>{l.lote}</option>)}</select></div>
                      </div>
                    ) : (
                      <div className="bg-[#1E293B]/30 p-3 rounded-2xl border border-slate-700/50 flex justify-between gap-3">
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">UV</label><input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1" /></div>
                        <div className="w-px bg-slate-700/50"></div>
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">MZN</label><input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1" /></div>
                        <div className="w-px bg-slate-700/50"></div>
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">LOTE</label><input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1" /></div>
                      </div>
                    )}

                    {lote && !modoManual && proyecto !== "OTRO" && (
                      (() => {
                        const status = getLoteStatus(categoriaLote || "Estándar");
                        return (
                          <div className={`mt-2 p-4 rounded-2xl border flex items-center gap-3 ${status.bg} ${status.border} shadow-lg relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full print-hide"></div>
                            <div className={`p-2.5 rounded-xl bg-black/20 ${status.color} border ${status.border} relative z-10`}>{status.icon}</div>
                            <div className="relative z-10">
                              <div className={`text-[10px] font-black uppercase tracking-wider ${status.color} flex items-center gap-1.5`}>
                                {status.text} <span className="text-slate-500 opacity-50">•</span> Categ: {categoriaLote || "Estándar"}
                              </div>
                              <div className="text-[11px] text-slate-300 font-medium mt-0.5 leading-tight">{status.desc}</div>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2.5"><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-400" /> Superficie (m²)</label><input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} readOnly={!modoManual && proyecto !== "OTRO" && lotesDB.length > 0} className={`w-full glass-input rounded-2xl p-4 font-extrabold text-white text-lg ${!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-default' : ''}`} /></div>
                      <div className="space-y-2.5"><label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Precio / m²</label><input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} readOnly={!modoManual && proyecto !== "OTRO" && lotesDB.length > 0} className={`w-full glass-input rounded-2xl p-4 font-extrabold text-white text-lg ${!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-default' : ''}`} /></div>
                    </div>

                    <div className="bg-[#1E293B]/40 border border-slate-700 p-5 rounded-[2rem]">
                      <div className="text-xs font-extrabold text-emerald-400 uppercase flex items-center gap-2 mb-4"><Gift className="w-4 h-4" /> Descuentos Promocionales</div>
                      <div className="grid grid-cols-2 gap-4">
                        {showDescPorcentaje && <><div className="space-y-1.5"><label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="accent-emerald-500" /> A Contado (%)</label><input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={e=>setDescuentoContado(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" /></div><div className="space-y-1.5"><label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="accent-emerald-500" /> A Crédito (%)</label><input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={e=>setDescuentoCredito(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" /></div></>}
                        {showDescM2 && <div className="space-y-1.5"><label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="accent-emerald-500" /> Crédito x m² ($us)</label><input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={e=>setDescuentoM2(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" /></div>}
                        {showDescContadoM2 && <div className="space-y-1.5"><label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="accent-emerald-500" /> Contado x m² ($us)</label><input type="number" step="0.01" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={e=>setDescuentoContadoM2(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" /></div>}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-5 mt-4">
                      <div className="col-span-12 md:col-span-8 bg-[#1E293B]/40 border border-slate-700 p-4 rounded-2xl grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[11px] font-extrabold text-cyan-400 uppercase"><Percent className="w-3.5 h-3.5 inline mr-1"/> Inicial (%)</label><input type="number" step="0.01" value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} className="w-full glass-input rounded-xl p-3 font-bold text-white" /></div>
                        <div className="space-y-2"><label className="text-[11px] font-extrabold text-cyan-400 uppercase"><DollarSign className="w-3.5 h-3.5 inline mr-1"/> Monto ($us)</label><input type="number" step="0.01" value={modoInicial === 'monto' ? inicialMonto : ''} onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} className="w-full glass-input rounded-xl p-3 font-bold text-white" /></div>
                      </div>
                      <div className="col-span-12 md:col-span-4 space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase"><Calendar className="w-4 h-4 inline text-cyan-500 mr-1"/> Plazo</label>
                        <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 font-bold text-white h-11">
                          <option value="" disabled hidden>Selec.</option>{[...Array(10)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} Años</option>))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 uppercase text-sm"><TrendingUp className="w-5 h-5" /> Procesar Cotización</button>
                  </form>
                </div>
              </div>

              {/* PANEL DERECHO: RESULTADOS (ESTE SERÁ EL PDF) */}
              <div className="lg:col-span-7 flex flex-col gap-6" ref={resultsRef}>
                {!resultado ? (
                  <div className="glass-panel-right rounded-[2.5rem] h-full min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-10 text-center print-hide">
                    <div className="bg-[#1E293B] p-8 rounded-full mb-8"><Calculator className="w-16 h-16 text-emerald-500 opacity-50" /></div>
                    <h3 className="text-3xl font-bold text-slate-300 mb-3">Plataforma Activa</h3>
                    <p className="text-sm font-medium">Completa los parámetros de inversión a la izquierda para generar la propuesta oficial.</p>
                  </div>
                ) : (
                  <div className="glass-panel-right rounded-[2.5rem] p-7 sm:p-10 relative overflow-hidden">
                    
                    {/* CABECERA ESPECIAL SOLO PARA EL PDF (VISIBLE SOLO AL IMPRIMIR) */}
                    <div className="hidden print:block text-center mb-8 border-b border-slate-300 pb-6">
                      <div className="text-3xl font-black text-emerald-600 mb-2 border-2 border-emerald-600 inline-block px-4 py-2 rounded-xl">CELINA</div>
                      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-2">Propuesta Oficial de Inversión</h1>
                      <p className="text-sm font-bold text-slate-600 uppercase mt-1">Grupo Paz - Máquina de Ventas</p>
                      <p className="text-xs text-slate-500 mt-2">Generado el: {resultado.fecha}</p>
                    </div>

                    {/* CABECERA NORMAL (APP) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 print-hide">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3"><div className="bg-[#1E293B] border border-emerald-500/30 p-2 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div> Propuesta Oficial</h2>
                      <span className="bg-emerald-500 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span> APROBADA</span>
                    </div>
                    
                    <div className="relative z-10 space-y-5">
                      
                      {/* Ficha Cliente (Solo en PDF si hay nombre) */}
                      {(resultado.cliente !== 'Cliente Preferencial' || resultado.asesor) && (
                        <div className="hidden print:flex justify-between bg-slate-100 p-4 rounded-xl border border-slate-300 mb-4">
                          {resultado.cliente !== 'Cliente Preferencial' && <div><p className="text-[10px] font-bold text-slate-500 uppercase">Inversionista</p><p className="font-bold text-slate-900 text-sm">{resultado.cliente}</p></div>}
                          {resultado.asesor && <div><p className="text-[10px] font-bold text-slate-500 uppercase">Asesor Comercial</p><p className="font-bold text-slate-900 text-sm">{resultado.asesor}</p></div>}
                        </div>
                      )}

                      {/* Proyecto / Lote */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-4 pl-2">
                          <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700 print-hide"><MapPin className="w-5 h-5 text-slate-400" /></div>
                          <div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase">Proyecto</div>
                            <div className="text-white font-black text-lg uppercase">{resultado.proyecto}</div>
                            
                            {/* Insignia VIP/Escasez en Resultados */}
                            <div className="flex items-center gap-1.5 mt-1">
                               {(() => {
                                  const status = getLoteStatus(resultado.categoria);
                                  return <span className={`${status.color} bg-black/20 px-2 py-0.5 rounded border ${status.border} font-bold text-[9px] uppercase flex items-center gap-1`}><span className="print-hide">{status.icon}</span> {status.text} ({resultado.categoria})</span>
                                })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">UV</div><div className="text-slate-300 font-bold text-sm">{resultado.uv || 'N/A'}</div></div>
                          <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">MZN</div><div className="text-slate-300 font-bold text-sm">{resultado.mzn || 'N/A'}</div></div>
                          <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">LOTE</div><div className="text-white font-black text-sm">{resultado.lote || 'N/A'}</div></div>
                          <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">ÁREA</div><div className="text-white font-black text-sm">{resultado.superficie} m²</div></div>
                        </div>
                      </div>

                      {/* Contado vs Lista */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] font-bold uppercase">Precio de Lista Original</span>
                          <div className="text-3xl font-black text-white mt-1">$ {resultado.valorOriginal}</div>
                        </div>
                        {resultado.valorContadoRaw < resultado.valorOriginalRaw ? (
                          <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/30">
                            <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                            <div className="text-3xl font-black text-emerald-400">$ {resultado.valorContado}</div>
                          </div>
                        ) : (
                          <div className="bg-cyan-500/10 p-6 rounded-2xl border border-cyan-500/30">
                            <div className="text-[10px] font-bold uppercase text-cyan-400 mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Ahorro Total a Plazos</div>
                            <div className="text-3xl font-black text-cyan-400">$ {resultado.ahorroCredito}</div>
                          </div>
                        )}
                      </div>

                      {/* Financiamiento Cards */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] font-bold uppercase">Total a Financiar</span>
                          <div className="text-2xl font-black text-white mt-1">$ <AnimatedNumber value={resultado.valorCreditoRaw} /></div>
                        </div>
                        <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                          <span className="text-slate-400 text-[10px] font-bold uppercase">Cuota Inicial ({resultado.pctInicial}%)</span>
                          <div className="text-2xl font-black text-white mt-1">$ <AnimatedNumber value={resultado.inicialRaw} /></div>
                        </div>
                      </div>

                      {/* Cuota Mensual Fija */}
                      <div className="bg-[#0F172A] p-8 sm:p-10 rounded-[2rem] border border-slate-700">
                        <span className="text-cyan-400 text-[10px] font-bold uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 print-hide"></div> Cuota Mensual Fija ({resultado.plazo} Años)</span>
                        <div className="mt-4">
                          <div className="text-6xl sm:text-7xl font-black text-white">$ <AnimatedNumber value={resultado.mensualRaw} /></div>
                          <div className="text-xl font-bold text-cyan-200/50 mt-1">Bs. <AnimatedNumber value={resultado.mensualBsRaw} /></div>
                        </div>
                      </div>

                      {/* --- SECCIÓN: GRÁFICO DE PLUSVALÍA --- */}
                      <div className="bg-[#121A2F] p-6 sm:p-8 rounded-[2rem] border border-emerald-900/30 mt-6 relative overflow-hidden print:border-slate-300 print:bg-white print:shadow-none print:mt-4">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl print:hidden"></div>
                          <h3 className="text-sm font-extrabold text-emerald-400 uppercase flex items-center gap-2 mb-2 print:text-emerald-700">
                              <BarChart3 className="w-5 h-5" /> Proyección de Plusvalía (12% Anual est.)
                          </h3>
                          <p className="text-slate-400 text-xs mb-6 max-w-xl print:text-slate-600">
                              La tierra es un activo que no se deprecia. Esta es la proyección de cómo crecerá su capital desde hoy hasta finalizar su plan de pagos, considerando la valorización histórica de la zona.
                          </p>
                          <div className="flex items-end justify-between gap-2 h-40 sm:h-48 mt-4 mx-2">
                              {resultado.proyeccionPlusvalia.map((item, idx) => (
                                  <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none print:hidden shadow-lg border border-slate-600">
                                          ${item.valorFormat}
                                      </div>
                                      <div className="hidden print:block text-[9px] font-bold text-slate-800 mb-1">
                                          ${item.valorFormat}
                                      </div>
                                      <div className={`w-full max-w-[45px] rounded-t-md transition-all duration-1000 ease-out relative flex items-end justify-center pb-2 
                                            ${idx === 0 ? 'bg-slate-700 print:bg-slate-300' : 
                                              idx === resultado.proyeccionPlusvalia.length - 1 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)] print:bg-emerald-500 print:shadow-none' : 
                                              'bg-cyan-900/40 group-hover:bg-cyan-700/60 print:bg-slate-200'}`}
                                          style={{ height: `${item.alturaPorcentaje}%` }}>
                                          {idx === resultado.proyeccionPlusvalia.length - 1 && <div className="absolute -top-1 w-full h-1 bg-white/50 rounded-t-md print:hidden"></div>}
                                      </div>
                                      <div className="text-[10px] font-black text-slate-500 mt-3 uppercase tracking-wider print:text-slate-600">{item.etiqueta}</div>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center print:border-slate-200">
                               <div>
                                   <div className="text-[10px] uppercase font-extrabold text-slate-500 print:text-slate-600">Valor Actual de la Tierra</div>
                                   <div className="text-sm font-black text-slate-300 print:text-slate-800">${resultado.valorOriginal}</div>
                               </div>
                               <div className="text-right">
                                   <div className="text-[10px] uppercase font-extrabold text-emerald-500 print:text-emerald-600">Patrimonio Proyectado (Año {resultado.plazo})</div>
                                   <div className="text-xl font-black text-emerald-400 print:text-emerald-600">+ ${resultado.proyeccionPlusvalia[resultado.proyeccionPlusvalia.length-1].valorFormat}</div>
                               </div>
                          </div>
                      </div>
                      {/* --- FIN SECCIÓN PLUSVALÍA --- */}

                      {/* ACCIONES Y BOTONES (SE OCULTAN AL IMPRIMIR) */}
                      <div className="flex flex-col gap-3 mt-8 print-hide">
                        
                        {/* NUEVO BOTÓN: GUARDAR EN CRM */}
                        <button 
                          onClick={guardarEnCRM} 
                          disabled={isSaved}
                          className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase transition-all shadow-lg border ${isSaved ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:scale-[1.01] border-amber-400 text-slate-900'}`}
                        >
                          {isSaved ? <><CheckCircle2 className="w-5 h-5"/> Cotización Registrada en CRM</> : <><Save className="w-5 h-5"/> 💾 Registrar en Base de Datos</>}
                        </button>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button onClick={enviarWhatsAppParte1} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase transition-all"><MessageSquareText className="w-4 h-4"/> 1️⃣ Enviar Intro</button>
                          <button onClick={enviarWhatsAppParte2} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[11px] uppercase transition-all"><Send className="w-4 h-4"/> 2️⃣ Enviar Cotización</button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={copiarTextoTodo} className="col-span-1 bg-[#1E293B] border border-cyan-900/50 text-cyan-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase">{isCopied ? "Copiado!" : "Copiar Todo"}</button>
                          {!escenarioA ? (
                             <button onClick={()=>{setEscenarioA(resultado); setShowComparativa(true);}} className="col-span-2 bg-[#1E293B] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase"><Scale className="w-4 h-4"/> Guardar Escenario A</button>
                          ) : (
                             <button onClick={()=>setShowComparativa(true)} className="col-span-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase"><Scale className="w-4 h-4"/> Comparar (A) vs (B)</button>
                          )}
                        </div>
                        
                        <button onClick={()=>setShowTablaPagos(!showTablaPagos)} className="w-full bg-[#1E293B] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase"><TableProperties className="w-4 h-4"/> Ver Plan de Pagos Completo</button>
                        
                        <button onClick={generarPDF} className="w-full bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase mt-2 shadow-lg hover:scale-[1.01] transition-transform">
                          <Printer className="w-5 h-5"/> Generar PDF Oficial
                        </button>
                      </div>

                      {/* TABLA DE PLAN DE PAGOS (SIEMPRE VISIBLE AL IMPRIMIR) */}
                      {(showTablaPagos || typeof window !== 'undefined') && (
                        <div className={`mt-4 rounded-2xl border border-slate-700 overflow-hidden ${!showTablaPagos ? 'hidden print:block' : ''}`}>
                          <div className="bg-[#1E293B] p-4 border-b border-slate-700 print:bg-slate-100 print:border-slate-300"><h4 className="font-bold text-slate-300 text-xs uppercase print:text-slate-800">Tabla de Amortización</h4></div>
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#0F172A] text-slate-500 uppercase font-bold print:bg-slate-200 print:text-slate-700">
                              <tr><th className="px-4 py-3 text-center">Año</th><th className="px-4 py-3 text-center">Inicial ($us)</th><th className="px-4 py-3 text-center">Mensual ($us)</th><th className="px-4 py-3 text-center text-cyan-500 print:text-slate-700">Mensual (Bs)</th></tr>
                            </thead>
                            <tbody>
                              {resultado.tablaPlazos.map((row, i) => (
                                <tr key={i} className={`border-b border-slate-800/50 print:border-slate-300 ${row.años === resultado.plazo ? 'bg-cyan-900/10 border-l-2 border-l-cyan-500 print:bg-slate-100 print:border-l-slate-800' : ''}`}>
                                  <td className="px-4 py-3 font-bold text-slate-300 text-center print:text-slate-800">{row.años}</td>
                                  <td className="px-4 py-3 text-center text-slate-500 print:text-slate-600">${row.cuota_inicial}</td>
                                  <td className="px-4 py-3 font-black text-white text-center print:text-slate-900">${row.cuota_mensual}</td>
                                  <td className="px-4 py-3 font-black text-cyan-400 text-center print:text-slate-700">Bs. {row.cuota_mensual_bs}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="hidden print:block mt-10 text-center text-xs text-slate-500 border-t border-slate-300 pt-4">
                        <p>Este documento es una propuesta de inversión y no constituye un contrato legal vinculante.</p>
                        <p>Los precios, descuentos y proyecciones de plusvalía están sujetos a modificaciones sin previo aviso.</p>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
