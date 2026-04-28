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

// --- ESTRUCTURA DE REGIONES Y PROYECTOS ---
const ESTRUCTURA_REGIONES = {
  "SANTA CRUZ": [
    "URUBÓ NORTE", "ROSA RODALI", "CELINA PAILÓN", "EL ENCANTO", "EL ENCANTO FASE 2", 
    "SANTA ROSA - FASE 1", "SANTA ROSA - FASE 2", "SANTA ROSA - FASE 3", 
    "TAMARINDO", "JARDINES DEL BOSQUE", "EL PORVENIR", "EL PORVENIR FASE 2", "OTRO..."
  ],
  "MONTERO": [
    "MUYURINA", "LOS JARDINES", "EL RENACER", "CELINA 3", "CELINA 4", "CELINA 5", 
    "RANCHO NUEVO", "CELINA X", "CAÑAVERAL", "SANTA FE", "VILLA BELLA VIVIENDAS", "OTRO..."
  ],
  "SATÉLITE NORTE": [
    "CELINA 7 FASE 3", "CELINA 8", "CLARA CHUCHIO", "SAN JORGE", 
    "CELINA VII FASE 1", "CELINA VII FASE 2", "PRADERAS DEL NORTE", "OTRO..."
  ]
};

// --- MOTOR DE DESCUENTOS MAXIMOS (ABRIL 2026) ---
const getDiscountLimits = (proj, tier) => {
  let limits = { contPct: 0, credPct: 0, contM2: 0, credM2: 0, showPct: false, showM2: false };
  
  if (proj === "OTRO...") {
      return { contPct: 100, credPct: 100, contM2: 500, credM2: 500, showPct: true, showM2: true };
  }

  const isM2_3 = ["LOS JARDINES", "SANTA FE", "EL RENACER", "RANCHO NUEVO", "SANTA ROSA - FASE 1", "SANTA ROSA - FASE 2", "SANTA ROSA - FASE 3", "EL ENCANTO FASE 2", "SAN JORGE", "EL PORVENIR", "EL PORVENIR FASE 2"].includes(proj);
  const isM2_4 = ["CAÑAVERAL", "EL ENCANTO", "CELINA 7 FASE 3"].includes(proj);
  const isPct30 = ["MUYURINA", "CELINA VII FASE 1", "CELINA VII FASE 2", "CELINA X", "TAMARINDO", "CLARA CHUCHIO", "URUBÓ NORTE", "CELINA 8"].includes(proj);
  const isPct32 = ["CELINA 3", "CELINA 4", "CELINA 5", "CELINA PAILÓN", "VILLA BELLA VIVIENDAS"].includes(proj);
  const isRosa = ["ROSA RODALI"].includes(proj);
  const isPraderas = ["PRADERAS DEL NORTE"].includes(proj);
  const isJardinesBosque = ["JARDINES DEL BOSQUE"].includes(proj);

  if (isM2_3) {
      limits.contM2 = 3; limits.credM2 = tier === 2 ? 2 : (tier === 1 ? 1 : 0);
      limits.showM2 = true;
  } else if (isM2_4) {
      limits.contM2 = 4; limits.credM2 = tier === 2 ? 2 : (tier === 1 ? 1 : 0);
      limits.showM2 = true;
  } else if (isPct30) {
      limits.contPct = 30; limits.credPct = tier === 2 ? 23 : (tier === 1 ? 20 : 0);
      limits.showPct = true;
  } else if (isPct32) {
      limits.contPct = 32; limits.credPct = tier === 2 ? 28 : (tier === 1 ? 25 : 0);
      limits.showPct = true;
  } else if (isRosa) {
      limits.contPct = 15; limits.credPct = tier > 0 ? 10 : 0;
      limits.showPct = true;
  } else if (isPraderas) {
      limits.contPct = 20; limits.credPct = tier > 0 ? 15 : 0;
      limits.showPct = true;
  } else if (isJardinesBosque) {
      limits.contM2 = 7; limits.credM2 = tier > 0 ? 5 : 0;
      limits.showM2 = true;
  }

  return limits;
};

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN Y PERFILES ---
  const [userRole, setUserRole] = useState(null); 
  const [currentView, setCurrentView] = useState("simulador"); 
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "MVENTAS26") {
      setUserRole("asesor"); setLoginError("");
    } else if (passwordInput === "GERENCIA26") {
      setUserRole("gerente"); setLoginError("");
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
            
            let cleanProyecto = String(getValue(['proyecto', 'urbanizacion', 'celina']) || "").toUpperCase().trim();
            
            // --- TRADUCTOR AUTOMÁTICO EXCEL -> MENÚ APP ---
            if (cleanProyecto === "CELINA III") cleanProyecto = "CELINA 3";
            else if (cleanProyecto === "CELINA IV") cleanProyecto = "CELINA 4";
            else if (cleanProyecto === "CELINA V") cleanProyecto = "CELINA 5";
            else if (cleanProyecto === "CELINA VI") cleanProyecto = "CELINA 6";
            else if (cleanProyecto === "CELINA VIII") cleanProyecto = "CELINA 8";
            else if (cleanProyecto === "CELINA VII FASE 3") cleanProyecto = "CELINA 7 FASE 3";
            else if (cleanProyecto === "CELINA MUYURINA") cleanProyecto = "MUYURINA";
            else if (cleanProyecto === "CELINA SANTA FE" || cleanProyecto === "SANTA FE") cleanProyecto = "SANTA FE";
            else if (cleanProyecto === "CELINA - RANCHO NUEVO" || cleanProyecto === "CELINA RANCHO NUEVO" || cleanProyecto === "RANCHO NUEVO") cleanProyecto = "RANCHO NUEVO";
            else if (cleanProyecto === "CELINA CLARA CHUCHIO" || cleanProyecto === "CLARA CHUCHIO") cleanProyecto = "CLARA CHUCHIO";
            else if (cleanProyecto === "CELINA URUBO DEL NORTE" || cleanProyecto === "CELINA URUBÓ DEL NORTE" || cleanProyecto === "URUBÓ NORTE") cleanProyecto = "URUBÓ NORTE";
            else if (cleanProyecto === "CELINA PAILON" || cleanProyecto === "CELINA PAILÓN" || cleanProyecto === "PAILON") cleanProyecto = "CELINA PAILÓN";
            else if (cleanProyecto.includes("ENCANTO FASE 2")) cleanProyecto = "EL ENCANTO FASE 2";
            else if (cleanProyecto.includes("ENCANTO")) cleanProyecto = "EL ENCANTO";
            else if (cleanProyecto === "CELINA VILLA BELLA" || cleanProyecto === "VILLA BELLA") cleanProyecto = "VILLA BELLA VIVIENDAS";
            else if (cleanProyecto === "PARAISO DEL NORTE") cleanProyecto = "PARAÍSO DEL NORTE";
            // ----------------------------------------------
            
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

  const [regional, setRegional] = useState("MONTERO");
  const proyectosOptions = ESTRUCTURA_REGIONES[regional];
  const [proyecto, setProyecto] = useState(proyectosOptions[0]);
  
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [nombreAsesor, setNombreAsesor] = useState("");
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [categoriaLote, setCategoriaLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  
  // ESTADOS DE LÍMITES Y DESCUENTOS EDITABLES
  const [maxDiscounts, setMaxDiscounts] = useState({ contPct: 0, credPct: 0, contM2: 0, credM2: 0, showPct: false, showM2: false });
  const [descuentoCredito, setDescuentoCredito] = useState("");
  const [descuentoContado, setDescuentoContado] = useState("");
  const [descuentoM2, setDescuentoM2] = useState("");
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(""); 
  
  const prevProyectoRef = useRef(proyecto);
  const prevTierRef = useRef(-1);

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

  // --- HELPER: SEMÁFORO DE DISPONIBILIDAD ---
  const getLoteStatus = (cat) => {
    const c = String(cat).toUpperCase();
    if (c.includes("ESQUINA") || c.includes("PARQUE") || c.includes("AVENIDA") || c.includes("COMERCIAL") || c.includes("VIP") || c.includes("ESTRATEGICO") || c.includes("ESTRATÉGICO") || c.includes("ESPECIAL")) {
      return { type: 'premium', icon: <Star className="w-5 h-5 text-amber-400" />, text: "Lote Estratégico", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", desc: "Alta demanda por ubicación." };
    }
    return { type: 'hot', icon: <Flame className="w-5 h-5 text-rose-400" />, text: "Alta Demanda", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", desc: "Últimos lotes en esta manzana." };
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleRegionalChange = (e) => {
    const nuevaRegional = e.target.value;
    setRegional(nuevaRegional);
    setProyecto(ESTRUCTURA_REGIONES[nuevaRegional][0]);
    setProyectoPersonalizado("");
  };

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado(""); setEscenarioA(null); setShowTablaPagos(false); setIsSaved(false);
    setAplicarDescContadoPct(true); setAplicarDescCreditoPct(true); setAplicarDescM2(true); setAplicarDescContadoM2(true); setAplicarBonoInicialOtro(true);
    
    if (proyecto !== "OTRO...") setModoManual(lotesDB.length === 0);
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

  // --- EFECTO MAESTRO PARA CALCULAR LÍMITES Y ACTUALIZAR AUTO ---
  useEffect(() => {
    let pct = 0;
    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie); const prec = Number(precio); const monto = Number(inicialMonto);
      if (sup > 0 && prec > 0 && monto > 0) {
        const basePre = (sup * prec) - (sup * (aplicarDescM2 ? Number(descuentoM2) : 0));
        const finalBase = basePre - (basePre * (aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0));
        if (finalBase > 0) pct = (monto / finalBase) * 100;
      }
    }
    
    let currentTier = 0;
    if (pct >= 5) currentTier = 2;
    else if (pct >= 1.5) currentTier = 1;

    const limits = getDiscountLimits(proyecto, currentTier);
    setMaxDiscounts(limits);

    // Si cambia el proyecto o el rango de Inicial, autocompletamos con el MÁXIMO
    if (proyecto !== prevProyectoRef.current || currentTier !== prevTierRef.current) {
        setDescuentoContado(limits.contPct);
        setDescuentoCredito(limits.credPct);
        setDescuentoContadoM2(limits.contM2);
        setDescuentoM2(limits.credM2);
        
        prevProyectoRef.current = proyecto;
        prevTierRef.current = currentTier;
    }
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, aplicarDescM2, aplicarDescCreditoPct]);

  // Validador manual de inputs (Para no pasarse del límite)
  const handleDiscountChange = (valStr, maxLimit, setterFunc) => {
      if (valStr === "") { setterFunc(""); return; }
      let val = Number(valStr);
      if (proyecto !== "OTRO..." && val > maxLimit) val = maxLimit;
      setterFunc(val);
  };

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
    // Solo aplica bono si es OTRO
    if (proyecto === "OTRO..." && aplicarBonoInicialOtro) descIniVal = 0; 

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    
    let monto_desc_contado_m2 = sup * descContadoM2Val;
    let monto_descuento_total_contado = 0;
    
    if (maxDiscounts.showM2 && !maxDiscounts.showPct) {
      // Regla exclusiva de proyectos M2
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

    const nombreProyectoFinal = proyecto === "OTRO..." ? proyectoPersonalizado : proyecto;
    const fechaActual = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    setResultado({
      proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, precioM2: prec, fecha: fechaActual,
      categoria: categoriaLote || "Estándar",
      cliente: nombreCliente || 'Cliente Preferencial', asesor: nombreAsesor,
      valorOriginalRaw: valor_original, valorContadoRaw: valor_contado,
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: aplicarDescContadoPct ? Number(descuentoContado) : 0, 
      descuentoContadoM2: aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0,
      valorCreditoRaw: valor_credito, inicialRaw: cuota_inicial, mensualRaw: cuota_final, mensualBsRaw: cuota_final * TIPO_CAMBIO,
      saldoFinanciarRaw: saldo, totalPagadoCreditoRaw: total_pagado_credito,
      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: aplicarDescCreditoPct ? Number(descuentoCredito) : 0, 
      descuentoM2: aplicarDescM2 ? Number(descuentoM2) : 0, 
      descuentoInicial: descIniVal,
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO), inicial: formatMoney(cuota_inicial),
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      plazo: ans, meses: meses, pctInicial: parseFloat(pct_inicial_real.toFixed(2)),
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO), tablaPlazos: tablaPlazos,
      proyeccionPlusvalia: proyeccionPlusvalia,
      regional: regional 
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
      regional: resultado.regional,
      ubicacion: `UV:${resultado.uv || '-'} MZN:${resultado.mzn || '-'} L:${resultado.lote || '-'}`,
      montoFinanciado: resultado.valorCreditoRaw
    };
    
    const nuevoHistorial = [nuevaData, ...historialCRM];
    setHistorialCRM(nuevoHistorial);
    localStorage.setItem('celina_crm_data', JSON.stringify(nuevoHistorial));
    setIsSaved(true);
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
    const ubicacion = `📍 *PROYECTO ${nombreProyectoCapitalizado || 'S/N'}* (${resultado.regional})\n🏷️ Categoría: ${resultado.categoria}\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;
    const precioLista = `💎 *Precio de Lista Original:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    if (resultado.descuentoContadoM2 > 0) arrContado.push(`$${resultado.descuentoContadoM2}/m²`);

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
        <div className="flex flex-col items-center justify-center min-h-screen relative z-20 px-4 bg-[#0B1121]/95 backdrop-blur-xl w-full">
          <div className="bg-[#121A2F] border border-slate-700/30 rounded-[2.5rem] p-8 sm:p-14 max-w-[420px] w-full text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
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
      <div className="max-w-[1200px] w-full mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* BARRA DE NAVEGACIÓN GERENCIAL CON DISEÑO RESPONSIVE */}
        {userRole === "gerente" && (
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl mx-auto mb-6 sm:mb-8 print-hide">
            <nav className="bg-[#1E293B]/80 backdrop-blur-lg border border-cyan-900/50 rounded-2xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 shadow-[0_0_20px_rgba(6,182,212,0.15)] w-full">
              <button onClick={() => setCurrentView("simulador")} className={`w-full px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${currentView === "simulador" ? "bg-cyan-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                 <Calculator className="w-4 h-4" /> Simulador de Ventas
              </button>
              <button onClick={() => setCurrentView("dashboard")} className={`w-full px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${currentView === "dashboard" ? "bg-emerald-500 text-slate-900 shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                 <LayoutDashboard className="w-4 h-4" /> Panel CRM Gerencial
              </button>
            </nav>
          </div>
        )}

        {currentView === "dashboard" && userRole === "gerente" ? (
          /* --- PANTALLA: PANEL DE CONTROL GERENCIAL --- */
          <div className="animate-in fade-in zoom-in-95 duration-500 w-full">
             <div className="flex flex-col items-center mb-8 sm:mb-10 w-full px-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(52,211,153,0.3)]"><Briefcase className="w-7 h-7 text-white" /></div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center leading-tight">Panel de Control <br className="sm:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">CRM</span></h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide mt-2 text-center">Control y Gestión Nacional</p>
             </div>

             {/* KPIs (Indicadores Clave) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full">
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-xl text-center sm:text-left w-full">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 text-cyan-400"><FolderOpen className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Cotizaciones Generadas</span></div>
                    <div className="text-4xl font-black text-white">{historialCRM.length}</div>
                </div>
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-emerald-900/50 p-6 rounded-[2rem] shadow-[0_0_30px_rgba(52,211,153,0.05)] text-center sm:text-left w-full overflow-hidden">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 text-emerald-400"><DollarSign className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Volumen Financiado</span></div>
                    <div className="text-3xl sm:text-4xl font-black text-white truncate w-full">$ {formatMoney(historialCRM.reduce((acc, curr) => acc + (curr.montoFinanciado || 0), 0))}</div>
                </div>
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-[2rem] shadow-xl text-center sm:text-left w-full sm:col-span-2 md:col-span-1">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 text-purple-400"><Users className="w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider">Asesores Activos</span></div>
                    <div className="text-4xl font-black text-white">{[...new Set(historialCRM.map(h => h.asesor))].length}</div>
                </div>
             </div>

             {/* Tabla de Base de Datos - CON LÍMITE DE ANCHO PARA CELULARES */}
             <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-700 rounded-[2rem] overflow-hidden w-full max-w-[calc(100vw-2rem)] sm:max-w-full mx-auto shadow-xl">
                <div className="p-4 sm:p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#1E293B]/30 w-full">
                   <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 text-center sm:text-left"><Database className="w-5 h-5 text-cyan-500"/> Registro de Actividad</h3>
                   <span className="bg-cyan-900/40 text-cyan-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase border border-cyan-500/30 whitespace-nowrap">Datos en Tiempo Real</span>
                </div>
                <div className="w-full overflow-x-auto">
                   <table className="w-full text-sm text-left text-slate-300 min-w-[800px]">
                      <thead className="text-xs text-slate-500 uppercase bg-[#0B1121]">
                         <tr>
                            <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                            <th className="px-6 py-4 font-bold">Regional</th>
                            <th className="px-6 py-4 font-bold">Cliente</th>
                            <th className="px-6 py-4 font-bold">Asesor</th>
                            <th className="px-6 py-4 font-bold">Proyecto</th>
                            <th className="px-6 py-4 font-bold">Ubicación</th>
                            <th className="px-6 py-4 font-bold text-right text-emerald-400">Financiado ($us)</th>
                         </tr>
                      </thead>
                      <tbody>
                         {historialCRM.length === 0 ? (
                           <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-500">No hay cotizaciones registradas aún.</td></tr>
                         ) : (
                           historialCRM.map((row) => (
                             <tr key={row.id} className="border-b border-slate-800/50 hover:bg-[#1E293B]/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">{row.fecha}</td>
                                <td className="px-6 py-4 font-bold text-cyan-500 whitespace-nowrap">{row.regional || "MONTERO"}</td>
                                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{row.cliente || "Sin nombre"}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{row.asesor}</span></td>
                                <td className="px-6 py-4 text-cyan-400 font-bold whitespace-nowrap">{row.proyecto}</td>
                                <td className="px-6 py-4 text-xs whitespace-nowrap">{row.ubicacion}</td>
                                <td className="px-6 py-4 text-right font-black text-emerald-400 whitespace-nowrap">${formatMoney(row.montoFinanciado)}</td>
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
            <header className="flex flex-col items-center mb-8 sm:mb-10 print-hide px-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0"><Building2 className="w-6 h-6 text-white" /></div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white text-center">Cotizador <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pro</span></h1>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide text-center">Diseñado por Oscar Saravia®</p>
            </header>

            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
              
              {/* PANEL IZQUIERDO: FORMULARIO */}
              <div className="lg:col-span-5 glass-panel-left rounded-[2.5rem] overflow-hidden transition-all duration-500 relative print-hide w-full max-w-[calc(100vw-2rem)] sm:max-w-full mx-auto shadow-2xl">
                <div className="p-5 sm:p-8 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="bg-[#1E293B] p-2 sm:p-2.5 rounded-xl border border-slate-600/50"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /></div><h2 className="text-base sm:text-lg font-bold text-white">Datos de Inversión</h2></div>
                  <button type="button" onClick={handleReset} className="p-2.5 bg-[#0F172A] hover:bg-[#1e293b] rounded-xl border border-slate-700/80 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
                </div>
                
                <div className="p-5 sm:p-8 bg-[#0F172A]/40 w-full">
                  <form onSubmit={calcular} className="space-y-5 sm:space-y-6 w-full">
                    <div className="space-y-4 bg-[#1E293B]/30 p-4 sm:p-5 rounded-2xl border border-cyan-900/30">
                      <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Cliente (Opcional)</label><input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Ej. Juan Pérez" className="w-full glass-input rounded-xl p-3 text-sm" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Asesor</label><input type="text" value={nombreAsesor} onChange={e => setNombreAsesor(e.target.value)} placeholder="Tu Nombre Completo" className="w-full glass-input rounded-xl p-3 text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {/* --- CAMPO: REGIONAL --- */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-500" /> Regional</label>
                        <select value={regional} onChange={handleRegionalChange} className="w-full glass-input rounded-2xl p-3 sm:p-4 font-bold text-white text-sm sm:text-base cursor-pointer border-cyan-700/50">
                          {Object.keys(ESTRUCTURA_REGIONES).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-500" /> Proyecto</label>
                          {proyecto !== "OTRO..." && lotesDB.length > 0 && (
                            <button type="button" onClick={() => setModoManual(!modoManual)} className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border whitespace-nowrap ${modoManual ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50'}`}>
                              {modoManual ? <><Edit3 className="w-3 h-3"/> Ingreso Manual</> : <><Database className="w-3 h-3"/> Buscar en BD</>}
                            </button>
                          )}
                        </div>
                        <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-3 sm:p-4 font-bold text-white text-sm sm:text-base cursor-pointer">
                          {proyectosOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    {proyecto === "OTRO..." && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} placeholder="Nombre del proyecto manual..." className="w-full glass-input rounded-2xl p-4 text-sm font-bold text-white mt-2" required />}

                    {!modoManual && proyecto !== "OTRO..." && lotesDB.length > 0 ? (
                      <div className="bg-cyan-900/10 p-3 sm:p-4 rounded-2xl border border-cyan-500/30 grid grid-cols-3 gap-2 sm:gap-3 w-full">
                        <div className="space-y-1.5 sm:space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">UV</label><select value={uv} onChange={handleUvChange} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2 sm:p-2.5 text-center font-bold text-white text-xs sm:text-sm px-1"><option value="" disabled hidden>---</option>{uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                        <div className="space-y-1.5 sm:space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">MZN</label><select value={mzn} onChange={handleMznChange} disabled={!uv} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2 sm:p-2.5 text-center font-bold text-white text-xs sm:text-sm px-1 disabled:opacity-50"><option value="" disabled hidden>---</option>{mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div className="space-y-1.5 sm:space-y-2"><label className="text-[9px] font-bold text-cyan-400 uppercase text-center block">LOTE</label><select value={lote} onChange={handleLoteChange} disabled={!mzn} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2 sm:p-2.5 text-center font-bold text-white text-xs sm:text-sm px-1 disabled:opacity-50"><option value="" disabled hidden>---</option>{lotesDisponibles.map(l => <option key={l.lote} value={l.lote}>{l.lote}</option>)}</select></div>
                      </div>
                    ) : (
                      <div className="bg-[#1E293B]/30 p-3 rounded-2xl border border-slate-700/50 flex justify-between gap-2 w-full">
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">UV</label><input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1 px-1 text-sm" /></div>
                        <div className="w-px bg-slate-700/50"></div>
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">MZN</label><input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1 px-1 text-sm" /></div>
                        <div className="w-px bg-slate-700/50"></div>
                        <div className="space-y-1.5 text-center w-full"><label className="text-[9px] font-bold text-slate-500 uppercase">LOTE</label><input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 pb-1 px-1 text-sm" /></div>
                      </div>
                    )}

                    {lote && !modoManual && proyecto !== "OTRO..." && (
                      (() => {
                        const status = getLoteStatus(categoriaLote || "Estándar");
                        return (
                          <div className={`mt-2 p-3 sm:p-4 rounded-2xl border flex items-center gap-3 ${status.bg} ${status.border} shadow-lg relative overflow-hidden w-full`}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full print-hide"></div>
                            <div className={`p-2 sm:p-2.5 rounded-xl bg-black/20 ${status.color} border ${status.border} relative z-10 shrink-0`}>{status.icon}</div>
                            <div className="relative z-10 w-full">
                              <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${status.color} flex flex-wrap items-center gap-1.5`}>
                                {status.text} <span className="text-slate-500 opacity-50 hidden sm:inline">•</span> <span className="text-slate-300">Categ: {categoriaLote || "Estándar"}</span>
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-0.5 leading-tight pr-2">{status.desc}</div>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full">
                      <div className="space-y-2.5"><label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 truncate"><Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> Superficie (m²)</label><input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} readOnly={!modoManual && proyecto !== "OTRO..." && lotesDB.length > 0} className={`w-full glass-input rounded-2xl p-3 sm:p-4 font-extrabold text-white text-base sm:text-lg ${!modoManual && proyecto !== "OTRO..." && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-default' : ''}`} /></div>
                      <div className="space-y-2.5"><label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 truncate"><DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" /> Precio / m²</label><input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} readOnly={!modoManual && proyecto !== "OTRO..." && lotesDB.length > 0} className={`w-full glass-input rounded-2xl p-3 sm:p-4 font-extrabold text-white text-base sm:text-lg ${!modoManual && proyecto !== "OTRO..." && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-default' : ''}`} /></div>
                    </div>

                    <div className="bg-[#1E293B]/40 border border-slate-700 p-4 sm:p-5 rounded-[2rem] w-full">
                      <div className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase flex items-center gap-2 mb-3 sm:mb-4"><Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Descuentos Permitidos</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                        {maxDiscounts.showPct && <>
                          <div className="space-y-1.5 w-full">
                            <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400">
                               <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="accent-emerald-500" /> A Contado (%) {proyecto !== "OTRO..." && maxDiscounts.contPct > 0 && <span className="text-emerald-500/80 ml-1">(Máx {maxDiscounts.contPct}%)</span>}
                            </label>
                            <input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={e => handleDiscountChange(e.target.value, maxDiscounts.contPct, setDescuentoContado)} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-sm" />
                          </div>
                          <div className="space-y-1.5 w-full">
                            <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400">
                               <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="accent-emerald-500" /> A Crédito (%) {proyecto !== "OTRO..." && maxDiscounts.credPct > 0 && <span className="text-emerald-500/80 ml-1">(Máx {maxDiscounts.credPct}%)</span>}
                            </label>
                            <input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={e => handleDiscountChange(e.target.value, maxDiscounts.credPct, setDescuentoCredito)} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-sm" />
                          </div>
                        </>}
                        
                        {maxDiscounts.showM2 && <>
                           <div className="space-y-1.5 w-full">
                             <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400">
                                <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="accent-emerald-500" /> Contado x m² ($us) {proyecto !== "OTRO..." && maxDiscounts.contM2 > 0 && <span className="text-emerald-500/80 ml-1">(Máx ${maxDiscounts.contM2})</span>}
                             </label>
                             <input type="number" step="0.01" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={e => handleDiscountChange(e.target.value, maxDiscounts.contM2, setDescuentoContadoM2)} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-sm" />
                           </div>
                           <div className="space-y-1.5 w-full">
                             <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400">
                                <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="accent-emerald-500" /> Crédito x m² ($us) {proyecto !== "OTRO..." && maxDiscounts.credM2 > 0 && <span className="text-emerald-500/80 ml-1">(Máx ${maxDiscounts.credM2})</span>}
                             </label>
                             <input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={e => handleDiscountChange(e.target.value, maxDiscounts.credM2, setDescuentoM2)} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-sm" />
                           </div>
                        </>}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4 w-full">
                      <div className="col-span-12 md:col-span-8 bg-[#1E293B]/40 border border-slate-700 p-3 sm:p-4 rounded-2xl grid grid-cols-2 gap-3 sm:gap-4 w-full">
                        <div className="space-y-2 w-full"><label className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 uppercase truncate"><Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1"/> Inicial (%)</label><input type="number" step="0.01" value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-white text-sm" /></div>
                        <div className="space-y-2 w-full"><label className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 uppercase truncate"><DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1"/> Monto ($us)</label><input type="number" step="0.01" value={modoInicial === 'monto' ? inicialMonto : ''} onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} className="w-full glass-input rounded-xl p-2.5 sm:p-3 font-bold text-white text-sm" /></div>
                      </div>
                      <div className="col-span-12 md:col-span-4 space-y-2 w-full">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline text-cyan-500 mr-1"/> Plazo</label>
                        <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3 sm:p-3.5 font-bold text-white h-11 sm:h-12 text-sm sm:text-base">
                          <option value="" disabled hidden>Selec.</option>{[...Array(10)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} Años</option>))}
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-extrabold py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 uppercase text-xs sm:text-sm shadow-lg hover:shadow-cyan-500/25 transition-all"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> Procesar Cotización</button>
                  </form>
                </div>
              </div>

              {/* PANEL DERECHO: RESULTADOS (ESTE SERÁ EL PDF) */}
              <div className="lg:col-span-7 flex flex-col gap-6" ref={resultsRef}>
                {!resultado ? (
                  <div className="glass-panel-right rounded-[2.5rem] h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-6 sm:p-10 text-center print-hide w-full max-w-[calc(100vw-2rem)] sm:max-w-full mx-auto shadow-2xl">
                    <div className="bg-[#1E293B] p-6 sm:p-8 rounded-full mb-6 sm:mb-8"><Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 opacity-50" /></div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-300 mb-2 sm:mb-3">Plataforma Activa</h3>
                    <p className="text-xs sm:text-sm font-medium max-w-xs">Completa los parámetros de inversión a la izquierda para generar la propuesta oficial.</p>
                  </div>
                ) : (
                  <div className="glass-panel-right rounded-[2.5rem] p-5 sm:p-7 md:p-10 relative overflow-hidden w-full max-w-[calc(100vw-2rem)] sm:max-w-full mx-auto shadow-2xl">
                    
                    {/* CABECERA ESPECIAL SOLO PARA EL PDF (VISIBLE SOLO AL IMPRIMIR) */}
                    <div className="hidden print:block text-center mb-8 border-b border-slate-300 pb-6">
                      <div className="text-3xl font-black text-emerald-600 mb-2 border-2 border-emerald-600 inline-block px-4 py-2 rounded-xl">CELINA</div>
                      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-2">Propuesta Oficial de Inversión</h1>
                      <p className="text-sm font-bold text-slate-600 uppercase mt-1">Grupo Paz - Máquina de Ventas</p>
                      <p className="text-xs text-slate-500 mt-2">Generado el: {resultado.fecha}</p>
                    </div>

                    {/* CABECERA NORMAL (APP) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4 print-hide w-full">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2 sm:gap-3"><div className="bg-[#1E293B] border border-emerald-500/30 p-1.5 sm:p-2 rounded-xl"><ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" /></div> Propuesta Oficial</h2>
                      <span className="bg-emerald-500 text-slate-900 text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full uppercase flex items-center gap-1.5 sm:gap-2 w-max"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-900 animate-pulse"></span> APROBADA</span>
                    </div>
                    
                    <div className="relative z-10 space-y-4 sm:space-y-5 w-full">
                      
                      {/* Ficha Cliente (Solo en PDF si hay nombre) */}
                      {(resultado.cliente !== 'Cliente Preferencial' || resultado.asesor) && (
                        <div className="hidden print:flex justify-between bg-slate-100 p-4 rounded-xl border border-slate-300 mb-4">
                          {resultado.cliente !== 'Cliente Preferencial' && <div><p className="text-[10px] font-bold text-slate-500 uppercase">Inversionista</p><p className="font-bold text-slate-900 text-sm">{resultado.cliente}</p></div>}
                          {resultado.asesor && <div><p className="text-[10px] font-bold text-slate-500 uppercase">Asesor Comercial</p><p className="font-bold text-slate-900 text-sm">{resultado.asesor}</p></div>}
                        </div>
                      )}

                      {/* Proyecto / Lote */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-700/50 w-full">
                        <div className="flex items-center gap-3 sm:gap-4 pl-1 sm:pl-2">
                          <div className="bg-[#0F172A] p-2.5 sm:p-3 rounded-xl border border-slate-700 print-hide shrink-0"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" /></div>
                          <div>
                            <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase">Proyecto ({resultado.regional})</div>
                            <div className="text-white font-black text-base sm:text-lg md:text-xl uppercase leading-tight">{resultado.proyecto}</div>
                            
                            {/* Insignia VIP/Escasez en Resultados */}
                            <div className="flex items-center gap-1.5 mt-1">
                               {(() => {
                                  const status = getLoteStatus(resultado.categoria);
                                  return <span className={`${status.color} bg-black/20 px-2 py-0.5 rounded border ${status.border} font-bold text-[8px] sm:text-[9px] uppercase flex items-center gap-1`}><span className="print-hide">{status.icon}</span> {status.text} ({resultado.categoria})</span>
                                })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-center px-3 sm:px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700 flex-1 sm:flex-none"><div className="text-[7px] sm:text-[8px] font-extrabold text-slate-500 uppercase">UV</div><div className="text-slate-300 font-bold text-xs sm:text-sm">{resultado.uv || '-'}</div></div>
                          <div className="text-center px-3 sm:px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700 flex-1 sm:flex-none"><div className="text-[7px] sm:text-[8px] font-extrabold text-slate-500 uppercase">MZN</div><div className="text-slate-300 font-bold text-xs sm:text-sm">{resultado.mzn || '-'}</div></div>
                          <div className="text-center px-3 sm:px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700 flex-1 sm:flex-none"><div className="text-[7px] sm:text-[8px] font-extrabold text-slate-500 uppercase">LOTE</div><div className="text-white font-black text-xs sm:text-sm">{resultado.lote || '-'}</div></div>
                          <div className="text-center px-3 sm:px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700 flex-1 sm:flex-none min-w-[70px]"><div className="text-[7px] sm:text-[8px] font-extrabold text-slate-500 uppercase">ÁREA</div><div className="text-white font-black text-xs sm:text-sm">{resultado.superficie}m²</div></div>
                        </div>
                      </div>

                      {/* Contado vs Lista */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                        <div className="bg-[#1E293B]/40 p-5 sm:p-6 rounded-2xl border border-slate-700/50 w-full">
                          <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase">Precio de Lista Original</span>
                          <div className="text-2xl sm:text-3xl font-black text-white mt-1 truncate">$ {resultado.valorOriginal}</div>
                        </div>
                        {resultado.valorContadoRaw < resultado.valorOriginalRaw ? (
                          <div className="bg-emerald-500/10 p-5 sm:p-6 rounded-2xl border border-emerald-500/30 w-full">
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-400 mb-1 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                            <div className="text-2xl sm:text-3xl font-black text-emerald-400 truncate">$ {resultado.valorContado}</div>
                          </div>
                        ) : (
                          <div className="bg-cyan-500/10 p-5 sm:p-6 rounded-2xl border border-cyan-500/30 w-full">
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase text-cyan-400 mb-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Ahorro Total a Plazos</div>
                            <div className="text-2xl sm:text-3xl font-black text-cyan-400 truncate">$ {resultado.ahorroCredito}</div>
                          </div>
                        )}
                      </div>

                      {/* Financiamiento Cards */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                        <div className="bg-[#1E293B]/40 p-4 sm:p-6 rounded-2xl border border-slate-700/50 w-full">
                          <span className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase">Total a Financiar</span>
                          <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">$ <AnimatedNumber value={resultado.valorCreditoRaw} /></div>
                        </div>
                        <div className="bg-[#1E293B]/40 p-4 sm:p-6 rounded-2xl border border-slate-700/50 w-full">
                          <span className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase">Cuota Inicial ({resultado.pctInicial}%)</span>
                          <div className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1 truncate">$ <AnimatedNumber value={resultado.inicialRaw} /></div>
                        </div>
                      </div>

                      {/* Cuota Mensual Fija */}
                      <div className="bg-[#0F172A] p-6 sm:p-8 md:p-10 rounded-[2rem] border border-slate-700 w-full">
                        <span className="text-cyan-400 text-[9px] sm:text-[10px] font-bold uppercase flex items-center gap-1.5 sm:gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 print-hide"></div> Cuota Mensual Fija ({resultado.plazo} Años)</span>
                        <div className="mt-3 sm:mt-4 w-full">
                          <div className="text-4xl sm:text-6xl md:text-7xl font-black text-white truncate w-full">$ <AnimatedNumber value={resultado.mensualRaw} /></div>
                          <div className="text-lg sm:text-xl font-bold text-cyan-200/50 mt-1 truncate w-full">Bs. <AnimatedNumber value={resultado.mensualBsRaw} /></div>
                        </div>
                      </div>

                      {/* --- SECCIÓN: GRÁFICO DE PLUSVALÍA --- */}
                      <div className="bg-[#121A2F] p-5 sm:p-8 rounded-[2rem] border border-emerald-900/30 mt-6 relative overflow-hidden print:border-slate-300 print:bg-white print:shadow-none print:mt-4 w-full">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl print:hidden"></div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase flex items-center gap-2 mb-2 print:text-emerald-700">
                              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Proyección Plusvalía (12% Anual est.)
                          </h3>
                          <p className="text-slate-400 text-[10px] sm:text-xs mb-6 max-w-xl print:text-slate-600 leading-relaxed">
                              La tierra es un activo que no se deprecia. Esta es la proyección de cómo crecerá su capital desde hoy hasta finalizar su plan de pagos, considerando la valorización histórica de la zona.
                          </p>
                          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32 sm:h-48 mt-4 mx-1 sm:mx-2">
                              {resultado.proyeccionPlusvalia.map((item, idx) => (
                                  <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-[9px] sm:text-[10px] font-bold py-1 px-1.5 sm:px-2 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none print:hidden shadow-lg border border-slate-600">
                                          ${item.valorFormat}
                                      </div>
                                      <div className="hidden print:block text-[8px] sm:text-[9px] font-bold text-slate-800 mb-1">
                                          ${item.valorFormat}
                                      </div>
                                      <div className={`w-full max-w-[25px] sm:max-w-[45px] rounded-t-sm sm:rounded-t-md transition-all duration-1000 ease-out relative flex items-end justify-center pb-2 
                                            ${idx === 0 ? 'bg-slate-700 print:bg-slate-300' : 
                                              idx === resultado.proyeccionPlusvalia.length - 1 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)] print:bg-emerald-500 print:shadow-none' : 
                                              'bg-cyan-900/40 group-hover:bg-cyan-700/60 print:bg-slate-200'}`}
                                          style={{ height: `${item.alturaPorcentaje}%` }}>
                                          {idx === resultado.proyeccionPlusvalia.length - 1 && <div className="absolute -top-0.5 sm:-top-1 w-full h-1 bg-white/50 rounded-t-sm sm:rounded-t-md print:hidden"></div>}
                                      </div>
                                      <div className="text-[8px] sm:text-[10px] font-black text-slate-500 mt-2 sm:mt-3 uppercase tracking-tighter sm:tracking-wider print:text-slate-600">{item.etiqueta}</div>
                                  </div>
                              ))}
                          </div>
                          <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 print:border-slate-200 w-full">
                               <div>
                                   <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-slate-500 print:text-slate-600">Valor Actual de la Tierra</div>
                                   <div className="text-xs sm:text-sm font-black text-slate-300 print:text-slate-800 truncate">${resultado.valorOriginal}</div>
                               </div>
                               <div className="text-left sm:text-right">
                                   <div className="text-[9px] sm:text-[10px] uppercase font-extrabold text-emerald-500 print:text-emerald-600">Patrimonio Proyectado (Año {resultado.plazo})</div>
                                   <div className="text-lg sm:text-xl font-black text-emerald-400 print:text-emerald-600 truncate">+ ${resultado.proyeccionPlusvalia[resultado.proyeccionPlusvalia.length-1].valorFormat}</div>
                               </div>
                          </div>
                      </div>
                      {/* --- FIN SECCIÓN PLUSVALÍA --- */}

                      {/* ACCIONES Y BOTONES (SE OCULTAN AL IMPRIMIR) */}
                      <div className="flex flex-col gap-3 mt-6 sm:mt-8 print-hide w-full">
                        
                        {/* BOTÓN: GUARDAR EN CRM */}
                        <button 
                          onClick={guardarEnCRM} 
                          disabled={isSaved}
                          className={`w-full font-black py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase transition-all shadow-lg border ${isSaved ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:scale-[1.01] border-amber-400 text-slate-900'}`}
                        >
                          {isSaved ? <><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5"/> Cotización Registrada en CRM</> : <><Save className="w-4 h-4 sm:w-5 sm:h-5"/> 💾 Registrar en Base de Datos</>}
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 sm:mt-2 w-full">
                          <button onClick={enviarWhatsAppParte1} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase transition-all"><MessageSquareText className="w-4 h-4 shrink-0"/> 1️⃣ Enviar Intro</button>
                          <button onClick={enviarWhatsAppParte2} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase transition-all"><Send className="w-4 h-4 shrink-0"/> 2️⃣ Enviar Cotización</button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                          <button onClick={copiarTextoTodo} className="w-full sm:col-span-1 bg-[#1E293B] border border-cyan-900/50 text-cyan-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase">{isCopied ? "Copiado!" : "Copiar Todo"}</button>
                          {!escenarioA ? (
                             <button onClick={()=>{setEscenarioA(resultado); setShowComparativa(true);}} className="w-full sm:col-span-2 bg-[#1E293B] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase"><Scale className="w-4 h-4 shrink-0"/> Guardar Escenario A</button>
                          ) : (
                             <button onClick={()=>setShowComparativa(true)} className="w-full sm:col-span-2 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase"><Scale className="w-4 h-4 shrink-0"/> Comparar (A) vs (B)</button>
                          )}
                        </div>
                        
                        <button onClick={()=>setShowTablaPagos(!showTablaPagos)} className="w-full bg-[#1E293B] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase"><TableProperties className="w-4 h-4 shrink-0"/> Ver Plan de Pagos</button>
                        
                        <button onClick={generarPDF} className="w-full bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600 text-white font-black py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase mt-1 sm:mt-2 shadow-lg hover:scale-[1.01] transition-transform">
                          <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"/> Generar PDF Oficial
                        </button>
                      </div>

                      {/* TABLA DE PLAN DE PAGOS (SIEMPRE VISIBLE AL IMPRIMIR) */}
                      {(showTablaPagos || typeof window !== 'undefined') && (
                        <div className={`mt-4 rounded-2xl border border-slate-700 overflow-hidden w-full ${!showTablaPagos ? 'hidden print:block' : ''}`}>
                          <div className="bg-[#1E293B] p-3 sm:p-4 border-b border-slate-700 print:bg-slate-100 print:border-slate-300 w-full"><h4 className="font-bold text-slate-300 text-[10px] sm:text-xs uppercase print:text-slate-800">Tabla de Amortización</h4></div>
                          <div className="w-full overflow-x-auto">
                            <table className="w-full text-[10px] sm:text-xs text-left min-w-[400px] sm:min-w-[500px]">
                              <thead className="bg-[#0F172A] text-slate-500 uppercase font-bold print:bg-slate-200 print:text-slate-700">
                                <tr><th className="px-3 sm:px-4 py-2 sm:py-3 text-center">Año</th><th className="px-3 sm:px-4 py-2 sm:py-3 text-center">Inicial ($)</th><th className="px-3 sm:px-4 py-2 sm:py-3 text-center">Mensual ($)</th><th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-cyan-500 print:text-slate-700">Mensual (Bs)</th></tr>
                              </thead>
                              <tbody>
                                {resultado.tablaPlazos.map((row, i) => (
                                  <tr key={i} className={`border-b border-slate-800/50 print:border-slate-300 ${row.años === resultado.plazo ? 'bg-cyan-900/10 border-l-2 border-l-cyan-500 print:bg-slate-100 print:border-l-slate-800' : ''}`}>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-bold text-slate-300 text-center print:text-slate-800">{row.años}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-slate-500 print:text-slate-600">${row.cuota_inicial}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-black text-white text-center print:text-slate-900">${row.cuota_mensual}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-black text-cyan-400 text-center print:text-slate-700">Bs. {row.cuota_mensual_bs}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="hidden print:block mt-8 sm:mt-10 text-center text-[10px] sm:text-xs text-slate-500 border-t border-slate-300 pt-4 w-full">
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

        {/* --- MODAL DE COMPARATIVA A vs B --- */}
        {showComparativa && escenarioA && resultado && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print-hide">
            <div className="bg-[#0F172A] border border-slate-700 w-full max-w-4xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 border-b border-slate-700 flex justify-between items-center bg-[#1E293B]/50">
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2"><Scale className="w-5 h-5 text-cyan-400"/> Comparativa de Inversión</h3>
                <button onClick={() => setShowComparativa(false)} className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Escenario A */}
                  <div className="bg-[#1E293B]/40 border border-slate-700 p-5 rounded-2xl flex flex-col h-full">
                    <div className="text-center mb-4 pb-4 border-b border-slate-700">
                      <div className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase inline-block mb-2">Escenario A (Guardado)</div>
                      <div className="text-2xl font-black text-white">{escenarioA.plazo} Años</div>
                      <div className="text-sm text-cyan-400 font-bold">Inicial: {escenarioA.pctInicial}% (${escenarioA.inicialRaw.toFixed(2)})</div>
                    </div>
                    <div className="space-y-3 text-sm flex-1">
                      <div className="flex justify-between"><span className="text-slate-400">Superficie:</span> <span className="font-bold text-white">{escenarioA.superficie} m²</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total a Financiar:</span> <span className="font-bold text-white">${escenarioA.valorCreditoRaw.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Ahorro Crédito:</span> <span className="font-bold text-emerald-400">{escenarioA.ahorroCredito}</span></div>
                    </div>
                    <div className="flex justify-between p-3 bg-[#0B1121] rounded-xl border border-slate-700 mt-4 items-center">
                      <span className="text-cyan-400 font-bold uppercase text-[10px] leading-tight">Cuota<br/>Mensual</span> 
                      <div className="text-right">
                         <span className="font-black text-xl text-white block">${escenarioA.mensualRaw.toFixed(2)}</span>
                         <span className="text-[10px] text-slate-500 font-bold">Bs. {escenarioA.mensualBsRaw.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Escenario B (Actual) */}
                  <div className="bg-cyan-900/10 border border-cyan-500/30 p-5 rounded-2xl relative overflow-hidden flex flex-col h-full shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full"></div>
                    <div className="text-center mb-4 pb-4 border-b border-cyan-900/50 relative z-10">
                      <div className="bg-cyan-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase inline-block mb-2">Escenario B (Actual)</div>
                      <div className="text-2xl font-black text-white">{resultado.plazo} Años</div>
                      <div className="text-sm text-cyan-400 font-bold">Inicial: {resultado.pctInicial}% (${resultado.inicialRaw.toFixed(2)})</div>
                    </div>
                    <div className="space-y-3 text-sm relative z-10 flex-1">
                      <div className="flex justify-between"><span className="text-slate-400">Superficie:</span> <span className="font-bold text-white">{resultado.superficie} m²</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total a Financiar:</span> <span className="font-bold text-white">${resultado.valorCreditoRaw.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Ahorro Crédito:</span> <span className="font-bold text-emerald-400">{resultado.ahorroCredito}</span></div>
                    </div>
                    <div className="flex justify-between p-3 bg-cyan-950/50 rounded-xl border border-cyan-800 mt-4 items-center relative z-10">
                      <span className="text-cyan-400 font-bold uppercase text-[10px] leading-tight">Cuota<br/>Mensual</span> 
                      <div className="text-right">
                         <span className="font-black text-xl text-white block">${resultado.mensualRaw.toFixed(2)}</span>
                         <span className="text-[10px] text-slate-500 font-bold">Bs. {resultado.mensualBsRaw.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      )}
    </div>
  );
}
